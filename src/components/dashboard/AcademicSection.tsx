import { useState, useRef, useMemo } from 'react';
import { Trash2, FileText, ExternalLink, Upload, Download, Link } from 'lucide-react';
import { useCourses, useResources, useAddCourse, useAddResource, useDeleteCourse, useDeleteResource } from '@/hooks/useAcademic';
import { useExamSuggestions, useAddExamSuggestion, useDeleteExamSuggestion } from '@/hooks/useExamSuggestions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { EditModeToggle } from './EditModeToggle';
import { toast } from 'sonner';

export const AcademicSection = () => {
  const { hasPermission } = useAuth();
  const { data: courses = [] } = useCourses();
  const { data: resources = [] } = useResources();
  const addCourse = useAddCourse();
  const addResource = useAddResource();
  const deleteCourse = useDeleteCourse();
  const deleteResource = useDeleteResource();

  const [courseForm, setCourseForm] = useState({ name: '', code: '', syllabus_link: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', url: '' });
  const [isEditMode, setIsEditMode] = useState(false);

  const canEdit = hasPermission('academic');

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name) return toast.error('Course name is required');
    
    try {
      await addCourse.mutateAsync(courseForm);
      setCourseForm({ name: '', code: '', syllabus_link: '' });
      toast.success('Course added');
    } catch (error) {
      toast.error('Failed to add course');
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.title || !resourceForm.url) return toast.error('Title and URL required');
    
    try {
      await addResource.mutateAsync(resourceForm);
      setResourceForm({ title: '', url: '' });
      toast.success('Resource added');
    } catch (error) {
      toast.error('Failed to add resource');
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">📘 Academic Resources</h2>
        {canEdit && (
          <EditModeToggle isEditMode={isEditMode} onToggle={() => setIsEditMode(!isEditMode)} />
        )}
      </div>

      {canEdit && isEditMode && (
        <div className="admin-form space-y-4">
          <form onSubmit={handleAddCourse} className="space-y-3">
            <h3 className="font-semibold">Add Course</h3>
            <Input 
              placeholder="Course Name" 
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="Code" 
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
              />
              <Input 
                placeholder="Syllabus Link" 
                value={courseForm.syllabus_link}
                onChange={(e) => setCourseForm({ ...courseForm, syllabus_link: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">Add Course</Button>
          </form>

          <hr className="border-border" />

          <form onSubmit={handleAddResource} className="space-y-3">
            <h3 className="font-semibold">Add Resource</h3>
            <Input 
              placeholder="Title" 
              value={resourceForm.title}
              onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
            />
            <Input 
              placeholder="URL" 
              value={resourceForm.url}
              onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
            />
            <Button type="submit" className="w-full">Add Resource</Button>
          </form>
        </div>
      )}

      {/* Courses */}
      <h3 className="text-lg font-semibold mb-3">📚 Courses</h3>
      <div className="space-y-3 mb-8">
        {courses.map((c) => (
          <Card key={c.id} className="p-4 flex items-center justify-between">
            <div>
              <span className="font-semibold">{c.name}</span>
              {c.code && <span className="text-muted-foreground ml-2">({c.code})</span>}
              {c.syllabus_link && (
                <a 
                  href={c.syllabus_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-3 text-accent hover:underline inline-flex items-center gap-1"
                >
                  Syllabus <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {canEdit && isEditMode && (
              <button 
                onClick={() => deleteCourse.mutate(c.id)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </Card>
        ))}
        {courses.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No courses added yet</p>
        )}
      </div>

      {/* Resources */}
      <h3 className="text-lg font-semibold mb-3">📄 Files & Links</h3>
      <div className="space-y-3">
        {resources.map((r) => (
          <Card key={r.id} className="p-4 flex items-center justify-between">
            <a 
              href={r.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline font-semibold inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {r.title}
            </a>
            {canEdit && isEditMode && (
              <button 
                onClick={() => deleteResource.mutate(r.id)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </Card>
        ))}
        {resources.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No resources added yet</p>
        )}
      </div>
    </div>
  );
};
