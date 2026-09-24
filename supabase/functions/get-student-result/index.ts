import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  mode?: "single" | "all";
  sid: string;
  dob: string;
  acyear?: string;
  semid?: string;
  years?: string[];
}

const SEMESTER_NAMES: Record<string, string> = {
  "1": "Spring",
  "2": "Summer",
  "3": "Fall",
};

async function fetchSingleSemester(
  cleanSid: string,
  cleanDob: string,
  cleanAcyear: string,
  cleanSemid: string
) {
  const targetUrl = `https://erp.uttarauniversity.edu.bd/online-result?sid=${encodeURIComponent(
    cleanSid
  )}&dob=${encodeURIComponent(cleanDob)}&acyear=${encodeURIComponent(
    cleanAcyear
  )}&semid=${encodeURIComponent(cleanSemid)}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const html = await response.text();

    if (html.includes("toastr.error")) {
      return null;
    }

    const info: Record<string, string> = {};
    const rowRegex =
      /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const key = match[1].replace(/<[^>]+>/g, "").trim().toLowerCase();
      const val = match[2]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
      if (key && val) {
        info[key] = val;
      }
    }

    if (!info["semester gpa"] && !info["name"]) {
      return null;
    }

    const gpaNum = parseFloat(info["semester gpa"] || "0");

    // Course breakdown if present
    const courses: Array<{
      code?: string;
      title?: string;
      credit?: string;
      grade?: string;
      point?: string;
    }> = [];

    const courseRowRegex =
      /<tr[^>]*>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*(?:<td[^>]*>(.*?)<\/td>)?\s*<\/tr>/gi;
    let courseMatch;
    while ((courseMatch = courseRowRegex.exec(html)) !== null) {
      const col1 = courseMatch[1]?.replace(/<[^>]+>/g, "").trim();
      const col2 = courseMatch[2]?.replace(/<[^>]+>/g, "").trim();
      const col3 = courseMatch[3]?.replace(/<[^>]+>/g, "").trim();
      const col4 = courseMatch[4]?.replace(/<[^>]+>/g, "").trim();
      const col5 = courseMatch[5]?.replace(/<[^>]+>/g, "").trim();

      if (
        col1 &&
        col2 &&
        col3 &&
        !col1.toLowerCase().includes("id") &&
        !col1.toLowerCase().includes("name") &&
        !col1.toLowerCase().includes("sl")
      ) {
        courses.push({
          code: col1,
          title: col2,
          credit: col3,
          grade: col4,
          point: col5 || "",
        });
      }
    }

    return {
      academicYear: cleanAcyear,
      semesterId: cleanSemid,
      semesterName: SEMESTER_NAMES[cleanSemid] || "Semester",
      semesterGpa: info["semester gpa"] || "0.00",
      numericGpa: isNaN(gpaNum) ? 0 : gpaNum,
      registrationNo: info["registration no"] || "",
      name: info["name"] || "",
      department: info["department"] || "",
      program: info["program"] || "",
      status: gpaNum > 0 ? "completed" : "pending",
      courses: courses.length > 0 ? courses : undefined,
      officialPortalUrl: targetUrl,
    };
  } catch (err) {
    console.error(`Error fetching year ${cleanAcyear} sem ${cleanSemid}:`, err);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { mode = "single", sid, dob, acyear, semid, years } = body;

    if (!sid || !dob) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters: sid and dob are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanSid = sid.trim().toUpperCase();
    const cleanDob = dob.trim();

    // Mode: ALL SEMESTERS (fetch historical and active semesters in parallel)
    if (mode === "all") {
      const targetYears =
        years && Array.isArray(years) && years.length > 0
          ? years
          : ["2024", "2025", "2026", "2027"];

      const tasks: Promise<any>[] = [];
      for (const yr of targetYears) {
        for (const sId of ["1", "2", "3"]) {
          tasks.push(fetchSingleSemester(cleanSid, cleanDob, yr, sId));
        }
      }

      const rawResults = await Promise.all(tasks);
      const validResults = rawResults.filter((r) => r !== null);

      if (validResults.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No results found on ERP for this student ID and Date of Birth.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Sort chronologically: by year ascending, then by semester ascending
      validResults.sort((a, b) => {
        const yrDiff = parseInt(a.academicYear) - parseInt(b.academicYear);
        if (yrDiff !== 0) return yrDiff;
        return parseInt(a.semesterId) - parseInt(b.semesterId);
      });

      // Calculate CGPA
      const completed = validResults.filter(
        (r) => r.status === "completed" && r.numericGpa > 0
      );
      const totalGpa = completed.reduce((sum, r) => sum + r.numericGpa, 0);
      const cgpa =
        completed.length > 0
          ? Number((totalGpa / completed.length).toFixed(2))
          : 0;
      const highestGpa =
        completed.length > 0
          ? Math.max(...completed.map((r) => r.numericGpa))
          : 0;

      const firstRecord = validResults[0];

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: cleanSid,
            name: firstRecord.name || "",
            registrationNo: firstRecord.registrationNo || "",
            department: firstRecord.department || "",
            program: firstRecord.program || "",
            cgpa,
            highestGpa,
            completedCount: completed.length,
            totalCount: validResults.length,
            semesters: validResults,
            syncedAt: new Date().toISOString(),
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Default: SINGLE SEMESTER MODE
    if (!acyear || !semid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing acyear or semid for single semester query.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const singleResult = await fetchSingleSemester(
      cleanSid,
      cleanDob,
      acyear.trim(),
      semid.trim()
    );

    if (!singleResult) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "No result published or student information not found for this academic session.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: singleResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in get-student-result:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch student result from ERP portal",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
