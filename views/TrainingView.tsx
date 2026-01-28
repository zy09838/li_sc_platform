import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, Award, Download, Search, Filter, ChevronRight, Loader2, FileText, Folder, CheckCircle2 } from 'lucide-react';
import { coursesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { SkeletonCard } from '../components/Loading';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  duration?: number;
  progress?: number;
  lessonCount?: number;
  instructor?: string;
  isEnrolled?: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: Course[];
  progress?: number;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  fileType: string;
  fileSize?: number;
  downloadCount?: number;
  createdAt: string;
}

export const TrainingView: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'courses' | 'my-courses' | 'paths' | 'docs'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['供应链管理', '质量管理', '安全生产', '数字化转型', '领导力', '通用技能'];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'courses':
          const coursesRes: any = await coursesApi.list({ category: categoryFilter || undefined });
          if (coursesRes.success) setCourses(coursesRes.data.courses);
          break;
        case 'my-courses':
          const myCoursesRes: any = await coursesApi.getMyCourses();
          if (myCoursesRes.success) setMyCourses(myCoursesRes.data);
          break;
        case 'paths':
          const pathsRes: any = await coursesApi.getLearningPaths();
          if (pathsRes.success) setLearningPaths(pathsRes.data);
          break;
        case 'docs':
          const docsRes: any = await coursesApi.getKnowledgeDocs({ 
            category: categoryFilter || undefined,
            search: searchQuery || undefined
          });
          if (docsRes.success) setKnowledgeDocs(docsRes.data.documents);
          break;
      }
    } catch (error) {
      console.error('Load data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDoc = async (docId: string) => {
    try {
      await coursesApi.downloadDoc(docId);
      // Increment download count in UI
      setKnowledgeDocs(prev => prev.map(d => 
        d.id === docId ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d
      ));
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleUpdateProgress = async (courseId: string, progress: number) => {
    try {
      await coursesApi.updateProgress(courseId, progress);
      setMyCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, progress } : c
      ));
    } catch (error) {
      console.error('Update progress failed:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-xs">PDF</div>;
      case 'doc':
      case 'docx':
        return <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">DOC</div>;
      case 'xls':
      case 'xlsx':
        return <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-xs">XLS</div>;
      case 'ppt':
      case 'pptx':
        return <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xs">PPT</div>;
      default:
        return <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600"><FileText size={20} /></div>;
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">培训中心</h1>
        <p className="text-sm text-gray-500 mt-1">提升技能，成就卓越</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <BookOpen size={16} /> 全部课程
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'my-courses'
                ? 'bg-teal-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Play size={16} /> 我的学习
          </button>
        )}
        <button
          onClick={() => setActiveTab('paths')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'paths'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Award size={16} /> 学习路径
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'docs'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Folder size={16} /> 知识库
        </button>
      </div>

      {/* Filters */}
      {(activeTab === 'courses' || activeTab === 'docs') && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {activeTab === 'docs' && (
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文档..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); loadData(); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : activeTab === 'courses' ? (
        /* All Courses */
        courses.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无课程</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="h-32 bg-gray-100 relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                      <BookOpen size={40} className="text-white/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-teal-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <Play size={16} /> 开始学习
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded">{course.category}</span>
                  <h3 className="font-bold text-gray-800 mt-2 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{course.description}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {course.duration}分钟
                      </span>
                    )}
                    {course.lessonCount && (
                      <span>{course.lessonCount} 课时</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'my-courses' ? (
        /* My Courses */
        myCourses.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Play size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">还没有开始学习任何课程</p>
            <button 
              onClick={() => setActiveTab('courses')}
              className="mt-4 text-teal-600 hover:text-teal-700 text-sm"
            >
              浏览课程
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myCourses.map(course => (
              <div key={course.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4">
                <div className="w-32 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                      <BookOpen size={24} className="text-white/80" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{course.title}</h3>
                    {course.progress === 100 && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 size={14} /> 已完成
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{course.category}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">学习进度</span>
                      <span className="text-xs font-medium text-teal-600">{course.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <button className="shrink-0 bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors self-center flex items-center gap-2">
                  <Play size={16} /> 继续学习
                </button>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'paths' ? (
        /* Learning Paths */
        learningPaths.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Award size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无学习路径</p>
          </div>
        ) : (
          <div className="space-y-4">
            {learningPaths.map(path => (
              <div key={path.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{path.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{path.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-teal-600">{path.progress || 0}%</span>
                    <p className="text-xs text-gray-400">完成度</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {path.courses.map((course, index) => (
                    <React.Fragment key={course.id}>
                      <div className={`shrink-0 w-24 p-2 rounded-lg border ${
                        (course.progress || 0) === 100 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className="text-xs font-medium text-gray-700 line-clamp-2">{course.title}</p>
                        <span className={`text-[10px] ${
                          (course.progress || 0) === 100 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {course.progress || 0}%
                        </span>
                      </div>
                      {index < path.courses.length - 1 && (
                        <ChevronRight size={16} className="shrink-0 text-gray-300" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Knowledge Docs */
        knowledgeDocs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Folder size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无文档</p>
          </div>
        ) : (
          <div className="space-y-3">
            {knowledgeDocs.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                {getFileIcon(doc.fileType)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 line-clamp-1">{doc.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{doc.category}</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>{doc.downloadCount || 0} 次下载</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDoc(doc.id)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                >
                  <Download size={16} /> 下载
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
