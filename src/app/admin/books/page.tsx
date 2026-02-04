'use client';

import React, { useState, useEffect } from 'react';

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [selectedIsbns, setSelectedIsbns] = useState<string[]>([]);

  const fetchBooks = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (search) params.append('search', search);
    if (statusFilter !== 'ALL') params.append('status', statusFilter);

    fetch(`/api/admin/books?${params}`)
      .then(res => res.json())
      .then(data => {
        setBooks(data.data || []);
        setMeta(data.meta || { page: 1, totalPages: 1, total: 0 });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooks();
  }, [page, statusFilter]); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleSave = async (updatedData: any) => {
    if (!editingBook) return;
    try {
        const res = await fetch(`/api/admin/books/${editingBook.isbn13}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (res.ok) { setEditingBook(null); fetchBooks(); alert('저장되었습니다!'); }
    } catch (e) { alert('에러 발생'); }
  };

  const handleReAudit = async (isbn: string) => {
    if (!confirm('최신 로직으로 재진단하시겠습니까?')) return;
    try {
        const res = await fetch(`/api/admin/books/${isbn}/re-audit`, { method: 'POST' });
        if (res.ok) { 
            const updated = await res.json();
            if (editingBook) setEditingBook(updated.data);
            fetchBooks();
            alert('재진단 완료!'); 
        }
    } catch (e) { alert('재진단 실패'); }
  };

  const handleBulkAction = async (action: string, status?: string) => {
    if (selectedIsbns.length === 0) return;
    if (!confirm(`${selectedIsbns.length}권에 대해 실행하시겠습니까?`)) return;

    try {
        const res = await fetch('/api/admin/books/bulk-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbns: selectedIsbns, action, status })
        });
        if (res.ok) {
            setSelectedIsbns([]);
            fetchBooks();
            alert('일괄 처리 완료!');
        }
    } catch (e) { alert('일괄 처리 실패'); }
  };

  const toggleSelectAll = () => {
    if (selectedIsbns.length === books.length) setSelectedIsbns([]);
    else setSelectedIsbns(books.map(b => b.isbn13));
  };

  const toggleSelect = (isbn: string) => {
    if (selectedIsbns.includes(isbn)) setSelectedIsbns(selectedIsbns.filter(i => i !== isbn));
    else setSelectedIsbns([...selectedIsbns, isbn]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">도서 관리</h2>
        <div className="text-sm text-gray-500">총 {meta.total}권 / 선택 {selectedIsbns.length}권</div>
        <div className="flex space-x-2">
            <select className="border p-2 rounded text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="ALL">전체 상태</option>
                <option value="pending">검수 필요</option>
                <option value="verified">검증 완료</option>
                <option value="rejected">반려됨</option>
            </select>
            <form onSubmit={handleSearch} className="flex">
                <input type="text" placeholder="제목, 저자 검색..." className="border p-2 rounded-l text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r text-sm">검색</button>
            </form>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIsbns.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded flex items-center justify-between shadow-sm">
            <div className="text-sm font-medium text-indigo-800">{selectedIsbns.length}권 선택됨</div>
            <div className="flex space-x-2">
                <button onClick={() => handleBulkAction('update-status', 'verified')} className="bg-green-600 text-white px-3 py-1 rounded text-xs">일괄 승인</button>
                <button onClick={() => handleBulkAction('update-status', 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-xs">일괄 반려</button>
                <button onClick={() => handleBulkAction('re-audit')} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">일괄 재진단</button>
            </div>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIsbns.length === books.length && books.length > 0} /></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">도서 정보</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">영역/나이</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">로딩 중...</td></tr>
            ) : books.map(book => (
              <tr key={book.id} className={selectedIsbns.includes(book.isbn13) ? 'bg-indigo-50' : ''}>
                <td className="px-4 py-4"><input type="checkbox" checked={selectedIsbns.includes(book.isbn13)} onChange={() => toggleSelect(book.isbn13)} /></td>
                <td className="px-6 py-4">
                    <div className="flex items-center">
                        {book.cover_url && <img src={book.cover_url} alt="" className="h-10 w-10 mr-3 object-cover rounded" />}
                        <div>
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{book.title}</div>
                            <div className="text-xs text-gray-500">{book.author}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                    <div className="font-medium text-indigo-600">{book.developmental_areas?.join(', ')}</div>
                    <div className="mt-1">{Math.floor(book.target_months_min/12)}~{Math.floor(book.target_months_max/12)}세</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-[10px] leading-5 font-semibold rounded-full ${
                    book.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 
                    book.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {book.verification_status === 'verified' ? '완료' : book.verification_status === 'rejected' ? '반려' : '대기'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => setEditingBook(book)} className="text-indigo-600 hover:text-indigo-900">수정</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center bg-white px-4 py-3 rounded shadow">
        <div className="text-sm text-gray-700">현재 <span className="font-medium">{meta.page}</span> / <span className="font-medium">{meta.totalPages}</span> 페이지</div>
        <div className="flex space-x-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={`px-4 py-2 border rounded text-sm ${page === 1 ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'}`}>이전</button>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className={`px-4 py-2 border rounded text-sm ${page >= meta.totalPages ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-50'}`}>다음</button>
        </div>
      </div>

      {editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">도서 정보 수정</h3>
                    <button onClick={() => handleReAudit(editingBook.isbn13)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-xs font-bold border border-blue-200 hover:bg-blue-100">🚀 로직 재진단</button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-4 p-3 bg-gray-50 rounded">
                        {editingBook.cover_url && <img src={editingBook.cover_url} alt="" className="w-24 h-32 object-cover rounded shadow" />}
                        <div className="flex-1">
                            <p className="font-bold text-lg">{editingBook.title}</p>
                            <p className="text-sm text-gray-500">{editingBook.author}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {editingBook.tags?.map((t: string) => <span key={t} className="bg-white px-2 py-0.5 border rounded text-[10px]">{t}</span>)}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">AI 추천 멘트</label>
                        <textarea className="mt-1 block w-full border rounded p-2 text-sm" rows={4} defaultValue={editingBook.ai_comment} id="edit-comment"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">검증 상태</label>
                        <select className="mt-1 block w-full border rounded p-2 text-sm" defaultValue={editingBook.verification_status} id="edit-status">
                            <option value="verified">검증 완료 (Verified)</option>
                            <option value="pending">검수 필요 (Pending)</option>
                            <option value="rejected">반려 (Rejected)</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                    <button onClick={() => setEditingBook(null)} className="px-4 py-2 border rounded text-sm">취소</button>
                    <button onClick={() => {
                        const comment = (document.getElementById('edit-comment') as HTMLTextAreaElement).value;
                        const status = (document.getElementById('edit-status') as HTMLSelectElement).value;
                        handleSave({ ai_comment: comment, verification_status: status });
                    }} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold shadow-lg">변경사항 저장</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}