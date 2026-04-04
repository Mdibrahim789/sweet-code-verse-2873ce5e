import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAboutWebsite } from '@/hooks/useAboutWebsite';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Save, X, Upload, Globe, Facebook, Linkedin, Github, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AboutSection = () => {
  const { isMaster } = useAuth();
  const { content, isLoading, updateContent, uploadImage } = useAboutWebsite();
  
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isEditing, setIsEditing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    content_en: '',
    content_bn: '',
    facebook_url: '',
    linkedin_url: '',
    github_url: '',
    contact_email: ''
  });

  const handleLanguageToggle = (newLang: 'en' | 'bn') => {
    if (newLang === language) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setLanguage(newLang);
      setIsTransitioning(false);
    }, 200);
  };

  const startEditing = () => {
    setFormData({
      name: content?.name || '',
      designation: content?.designation || '',
      content_en: content?.content_en || '',
      content_bn: content?.content_bn || '',
      facebook_url: content?.facebook_url || '',
      linkedin_url: content?.linkedin_url || '',
      github_url: content?.github_url || '',
      contact_email: content?.contact_email || ''
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = async () => {
    await updateContent.mutateAsync({
      name: formData.name || null,
      designation: formData.designation || null,
      content_en: formData.content_en,
      content_bn: formData.content_bn,
      facebook_url: formData.facebook_url || null,
      linkedin_url: formData.linkedin_url || null,
      github_url: formData.github_url || null,
      contact_email: formData.contact_email || null
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      await updateContent.mutateAsync({ image_url: imageUrl });
    }
  };

  const currentContent = language === 'en' ? content?.content_en : content?.content_bn;

  const defaultContentEn = `Welcome to the official digital platform for the 49th Batch, 'D' Section, Department of Electrical and Electronic Engineering at Uttara University.

I built this website with a vision to bring our batch together in a unified digital space. As students of EEE, we often struggle to find consolidated information about class schedules, attendance, notices, and faculty contacts.

This platform aims to solve that by providing:
• Real-time class routines and schedules
• Attendance tracking and management
• Important notices and announcements
• Faculty information and contact details
• Bus schedule for commuting students
• A gallery to preserve our memories

My goal is to make our academic journey smoother and more connected. This is not just a website—it's a digital home for our batch.`;

  const defaultContentBn = `উত্তরা বিশ্ববিদ্যালয়ের ইলেকট্রিক্যাল অ্যান্ড ইলেকট্রনিক ইঞ্জিনিয়ারিং বিভাগের ৪৯তম ব্যাচ, 'ডি' সেকশনের অফিসিয়াল ডিজিটাল প্ল্যাটফর্মে স্বাগতম।

আমি এই ওয়েবসাইটটি তৈরি করেছি আমাদের ব্যাচকে একটি একক ডিজিটাল স্পেসে একত্রিত করার লক্ষ্যে। EEE-এর ছাত্র হিসেবে, আমরা প্রায়ই ক্লাস রুটিন, উপস্থিতি, নোটিশ এবং শিক্ষকদের যোগাযোগের তথ্য একসাথে খুঁজে পেতে সমস্যায় পড়ি।

এই প্ল্যাটফর্ম সেই সমস্যার সমাধান করতে চায়:
• রিয়েল-টাইম ক্লাস রুটিন ও সময়সূচী
• উপস্থিতি ট্র্যাকিং ও ব্যবস্থাপনা
• গুরুত্বপূর্ণ নোটিশ ও ঘোষণা
• শিক্ষকদের তথ্য ও যোগাযোগ
• যাতায়াতকারী শিক্ষার্থীদের জন্য বাস সময়সূচী
• আমাদের স্মৃতি সংরক্ষণের জন্য গ্যালারি

আমার লক্ষ্য হল আমাদের একাডেমিক যাত্রা আরও মসৃণ ও সংযুক্ত করা।`;

  const displayContent = currentContent || (language === 'en' ? defaultContentEn : defaultContentBn);

  const socialLinks = [
    { url: content?.facebook_url, icon: Facebook, label: 'Facebook', color: 'hover:text-blue-500' },
    { url: content?.linkedin_url, icon: Linkedin, label: 'LinkedIn', color: 'hover:text-blue-600' },
    { url: content?.github_url, icon: Github, label: 'GitHub', color: 'hover:text-foreground' },
    { url: content?.contact_email, icon: Mail, label: 'Email', color: 'hover:text-primary', isEmail: true }
  ].filter(link => link.url);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-primary text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {language === 'en' ? 'Why I Built This Website' : 'কেন আমি এই ওয়েবসাইট তৈরি করলাম'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'en' 
              ? '49th Batch, D Section, EEE, Uttara University' 
              : '৪৯তম ব্যাচ, ডি সেকশন, EEE, উত্তরা বিশ্ববিদ্যালয়'}
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => handleLanguageToggle('bn')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              language === 'bn' 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🇧🇩 BN
          </button>
          <button
            onClick={() => handleLanguageToggle('en')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              language === 'en' 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {language === 'en' ? 'My Vision' : 'আমার দৃষ্টিভঙ্গি'}
            </CardTitle>
            {isMaster() && !isEditing && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEditing}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveChanges} disabled={updateContent.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Designation</label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Developer, Student"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Social Links</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      placeholder="Facebook profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      placeholder="LinkedIn profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      placeholder="GitHub profile URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="Contact email"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="border-t border-border pt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    English Content
                  </label>
                  <Textarea
                    value={formData.content_en}
                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                    rows={10}
                    className="resize-none"
                    placeholder="Enter English content..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    বাংলা Content
                  </label>
                  <Textarea
                    value={formData.content_bn}
                    onChange={(e) => setFormData({ ...formData, content_bn: e.target.value })}
                    rows={10}
                    className="resize-none"
                    placeholder="বাংলা কন্টেন্ট লিখুন..."
                  />
                </div>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Text Content */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div 
                  className={cn(
                    "prose prose-sm sm:prose max-w-none dark:prose-invert transition-opacity duration-200",
                    isTransitioning ? "opacity-0" : "opacity-100"
                  )}
                >
                  <div className="whitespace-pre-line text-foreground/90 leading-relaxed">
                    {displayContent}
                  </div>
                </div>
              </div>

              {/* Profile Section */}
              <div className="lg:col-span-1 order-1 lg:order-2 flex flex-col items-center">
                <div className="relative group">
                  <Avatar className="w-40 h-40 sm:w-48 sm:h-48 border-4 border-primary/20 shadow-xl">
                    <AvatarImage 
                      src={content?.image_url || ''} 
                      alt="Profile" 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                      {content?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isMaster() && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Name & Designation */}
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-foreground">
                    {content?.name || 'Abu Ebrahim'}
                  </h3>
                  <p className="text-primary font-medium">
                    {content?.designation || 'Developer & Creator'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'en' ? 'EEE, Uttara University' : 'EEE, উত্তরা বিশ্ববিদ্যালয়'}
                  </p>
                </div>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex justify-center gap-3 mt-4">
                    {socialLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.isEmail ? `mailto:${link.url}` : link.url || '#'}
                        target={link.isEmail ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        className={`p-2.5 rounded-full bg-muted/50 text-muted-foreground transition-colors ${link.color}`}
                        title={link.label}
                      >
                        <link.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
