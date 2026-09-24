import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  sid: string;
  dob: string;
  acyear: string;
  semid: string;
}

const SEMESTER_NAMES: Record<string, string> = {
  "1": "Spring",
  "2": "Summer",
  "3": "Fall",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sid, dob, acyear, semid } = (await req.json()) as RequestBody;

    if (!sid || !dob || !acyear || !semid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters: sid, dob, acyear, semid",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanSid = sid.trim().toUpperCase();
    const cleanDob = dob.trim();
    const cleanAcyear = acyear.trim();
    const cleanSemid = semid.trim();

    // Target URL on Uttara University ERP
    const targetUrl = `https://erp.uttarauniversity.edu.bd/online-result?sid=${encodeURIComponent(
      cleanSid
    )}&dob=${encodeURIComponent(cleanDob)}&acyear=${encodeURIComponent(
      cleanAcyear
    )}&semid=${encodeURIComponent(cleanSemid)}`;

    console.log(`Fetching result for SID: ${cleanSid}, Year: ${cleanAcyear}, Sem: ${cleanSemid}`);

    // Fetch with redirect follow
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

    // Check for toastr error
    const toastrErrorMatch = html.match(/toastr\.error\(\s*["']([^"']+)["']\s*\)/i);
    if (toastrErrorMatch) {
      return new Response(
        JSON.stringify({
          success: false,
          error: toastrErrorMatch[1],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse Student Information Table
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

    // Verify if we found valid student result
    if (!info["semester gpa"] && !info["name"]) {
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

    // Parse course grades if a detailed course breakdown table exists
    const courses: Array<{
      code?: string;
      title?: string;
      credit?: string;
      grade?: string;
      point?: string;
    }> = [];

    // Course table parser (if available in HTML)
    const courseRowRegex =
      /<tr[^>]*>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*(?:<td[^>]*>(.*?)<\/td>)?\s*<\/tr>/gi;
    let courseMatch;
    while ((courseMatch = courseRowRegex.exec(html)) !== null) {
      const col1 = courseMatch[1]?.replace(/<[^>]+>/g, "").trim();
      const col2 = courseMatch[2]?.replace(/<[^>]+>/g, "").trim();
      const col3 = courseMatch[3]?.replace(/<[^>]+>/g, "").trim();
      const col4 = courseMatch[4]?.replace(/<[^>]+>/g, "").trim();
      const col5 = courseMatch[5]?.replace(/<[^>]+>/g, "").trim();

      // Check if this looks like a course row
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

    const resultData = {
      id: info["id"] || cleanSid,
      registrationNo: info["registration no"] || "",
      name: info["name"] || "",
      department: info["department"] || "",
      program: info["program"] || "",
      semesterGpa: info["semester gpa"] || "",
      academicYear: cleanAcyear,
      semesterId: cleanSemid,
      semesterName: SEMESTER_NAMES[cleanSemid] || "Semester",
      courses: courses.length > 0 ? courses : undefined,
      officialPortalUrl: targetUrl,
      queriedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: resultData,
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
