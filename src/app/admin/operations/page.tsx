
'use client';

import React, { useState, useEffect } from 'react';

export default function OperationsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [backlog, setBacklog] = useState<any[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [ideaType, setIdeaType] = useState('improvement');
  const [loading, setLoading] = useState(true); // Add loading state

  const fetchData = () => {
    setLoading(true);
    fetch('/api/admin/operations')
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || []); // Ensure array
        setBacklog(data.backlog || []); // Ensure array
        setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTask = async (id: string, current: boolean) => {
    // Optimistic update could be added here
    await fetch('/api/admin/operations', {
        method: 'PATCH',
        body: JSON.stringify({ type: 'task', id, is_completed: !current })
    });
    fetchData();
  };

  const addBacklog = async () => {
    if (!newIdea) return;
    await fetch('/api/admin/operations', {
        method: 'POST',
        body: JSON.stringify({ type: 'backlog', category: ideaType, content: newIdea, priority: 'medium' })
    });
    setNewIdea('');
    fetchData();
  };

  const updateBacklogStatus = async (id: string, status: string) => {
    await fetch('/api/admin/operations', {
        method: 'PATCH',
        body: JSON.stringify({ type: 'backlog', id, status })
    });
    fetchData();
  };

  if (loading && tasks.length === 0) return <div className="p-8 text-center text-gray-500">데이터 로딩 중...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">운영 관제 센터</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Checklist Section */}
        <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                ✅ 데일리 체크리스트
            </h3>
            <ul className="space-y-3">
                {tasks.map((task) => (
                    <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleTask(task.id, task.is_completed)}
                    >
                        <div className="flex items-center">
                            <span className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                                {task.is_completed && <span className="text-white text-xs">✓</span>}
                            </span>
                            <span className={task.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}>
                                {task.task_name}
                            </span>
                        </div>
                        <span className="text-xs text-gray-400 uppercase mr-2">{task.category}</span>
                        {task.command && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(task.command);
                                    alert('명령어가 복사되었습니다: ' + task.command);
                                }}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded flex items-center"
                                title="터미널 명령어 복사"
                            >
                                <span className="mr-1">📋</span> CMD
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>

        {/* Backlog Section */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-800 mb-4">💡 시스템 개선 노트</h3>
            
            <div className="flex gap-2 mb-4">
                <select value={ideaType} onChange={e => setIdeaType(e.target.value)} className="border p-2 rounded text-sm">
                    <option value="improvement">개선</option>
                    <option value="bug">버그</option>
                    <option value="feature">기능</option>
                </select>
                <input 
                    type="text" 
                    value={newIdea} 
                    onChange={e => setNewIdea(e.target.value)}
                    placeholder="아이디어를 입력하세요..." 
                    className="border p-2 rounded flex-1 text-sm"
                    onKeyPress={e => e.key === 'Enter' && addBacklog()}
                />
                <button onClick={addBacklog} className="bg-indigo-600 text-white px-4 rounded text-sm">추가</button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {backlog.map((item) => (
                    <div key={item.id} className="p-3 border rounded flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold ${
                                    item.type === 'bug' ? 'bg-red-100 text-red-700' : 
                                    item.type === 'feature' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                    {item.type}
                                </span>
                                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-800">{item.content}</p>
                        </div>
                        <select 
                            value={item.status} 
                            onChange={(e) => updateBacklogStatus(item.id, e.target.value)}
                            className={`text-xs border rounded p-1 ${item.status === 'done' ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
                        >
                            <option value="open">Open</option>
                            <option value="in_progress">진행중</option>
                            <option value="done">완료</option>
                        </select>
                    </div>
                ))}
                {backlog.length === 0 && <p className="text-sm text-gray-400 text-center py-4">아직 등록된 아이디어가 없습니다.</p>}
            </div>
        </div>
      </div>
    </div>
  );
}
