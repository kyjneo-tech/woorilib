
'use client';

import React, { useState, useEffect } from 'react';

// Type definition for Rule
interface ClassificationRule {
    id: string;
    name: string;
    type: string;
    keywords: string[];
    description?: string;
    metadata: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function RulesPage() {
    const [rules, setRules] = useState<ClassificationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRule, setCurrentRule] = useState<Partial<ClassificationRule>>({
        name: '',
        type: 'sub_competency',
        keywords: [],
        metadata: {}
    });

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/rules');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRules(data);
            }
        } catch (error) {
            console.error('Failed to fetch rules:', error);
            alert('규칙을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleCreate = () => {
        setCurrentRule({
            name: '',
            type: 'sub_competency',
            keywords: [],
            metadata: {},
            is_active: true
        });
        setIsEditing(true);
    };

    const handleEdit = (rule: ClassificationRule) => {
        setCurrentRule({ ...rule });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 규칙을 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/admin/rules?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchRules();
            } else {
                alert('삭제 실패');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('삭제 중 오류 발생');
        }
    };

    const handleSave = async () => {
        if (!currentRule.name || !currentRule.type) {
            alert('이름과 타입은 필수입니다.');
            return;
        }

        try {
            const method = currentRule.id ? 'PUT' : 'POST';
            const body = JSON.stringify(currentRule);

            const res = await fetch('/api/admin/rules', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });

            if (res.ok) {
                setIsEditing(false);
                fetchRules();
            } else {
                const err = await res.json();
                alert(`저장 실패: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('저장 중 오류 발생');
        }
    };

    // Keyword Management Helper
    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Handling keyword input could be improved with a tag input component
        // For now, let's parse comma separated values on blur or have a separate input
    };

    // Simple array input handler
    const updateKeywords = (val: string) => {
        const arr = val.split(',').map(s => s.trim()).filter(Boolean);
        setCurrentRule(prev => ({ ...prev, keywords: arr }));
    };

    // Metadata Input Helpers
    const updateParentArea = (val: string) => {
        setCurrentRule(prev => ({
            ...prev,
            metadata: { ...prev.metadata, parent_area: val }
        }));
    };

    if (loading) return <div className="p-8 text-center text-gray-500">규칙 로딩 중...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">분류 규칙 관리</h2>
                <button
                    onClick={handleCreate}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                    + 새 규칙 추가
                </button>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">{currentRule.id ? '규칙 수정' : '새 규칙 생성'}</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">규칙 이름 (Sub-competency)</label>
                                    <input
                                        type="text"
                                        value={currentRule.name}
                                        onChange={e => setCurrentRule(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border rounded p-2"
                                        placeholder="예: 공룡"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                                    <select
                                        value={currentRule.type}
                                        onChange={e => setCurrentRule(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full border rounded p-2"
                                    >
                                        <option value="sub_competency">Sub Competency</option>
                                        <option value="developmental_area">Developmental Area</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">상위 영역 (Parent Area)</label>
                                <select
                                    value={currentRule.metadata?.parent_area || ''}
                                    onChange={e => updateParentArea(e.target.value)}
                                    className="w-full border rounded p-2"
                                >
                                    <option value="">선택 안함</option>
                                    <option value="신체운동·건강">신체운동·건강</option>
                                    <option value="의사소통">의사소통</option>
                                    <option value="사회관계">사회관계</option>
                                    <option value="예술경험">예술경험</option>
                                    <option value="자연탐구">자연탐구</option>
                                    <option value="생활습관">생활습관</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">* Sub Competency인 경우 상위 영역을 지정해야 매핑이 작동합니다.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">키워드 (쉼표로 구분)</label>
                                <textarea
                                    value={currentRule.keywords?.join(', ')}
                                    onChange={e => updateKeywords(e.target.value)}
                                    className="w-full border rounded p-2 min-h-[80px]"
                                    placeholder="예: 공룡, 티라노, 트리케라톱스, 화석"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
                                <input
                                    type="text"
                                    value={currentRule.description || ''}
                                    onChange={e => setCurrentRule(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rules List Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름 / 타입</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상위 영역</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">키워드</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                                    <div className="text-xs text-gray-500">{rule.type}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {rule.metadata?.parent_area ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            {rule.metadata.parent_area}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
                                        {rule.keywords?.slice(0, 5).map((kw, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                {kw}
                                            </span>
                                        ))}
                                        {rule.keywords?.length > 5 && (
                                            <span className="text-xs text-gray-400 self-center">+{rule.keywords.length - 5} more</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(rule)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rules.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                        등록된 규칙이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
