import { useState, useEffect } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Student {
  id: string;
  name: string;
  class: string;
  email: string;
}

const StudentManager = () => {
  const [addedStudents, setAddedStudents] = useState<Student[]>([]);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Fetch danh sách học sinh đã thêm ban đầu
  useEffect(() => {
    fetchInitialStudents();
  }, []);

  // Tìm kiếm khi người dùng nhập
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        searchStudents(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchInitialStudents = async () => {
    try {
      setLoading(true);
      // Thay thế URL này bằng API endpoint lấy danh sách học sinh đã thêm
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      const data = await response.json();
      
      const transformedStudents: Student[] = data.slice(0, 3).map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        class: `Lớp ${Math.floor(Math.random() * 12) + 1}A`,
        email: user.email
      }));
      
      setAddedStudents(transformedStudents);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách học sinh');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async (query: string) => {
    try {
      setSearching(true);
      // Thay thế URL này bằng API endpoint tìm kiếm học sinh
      const response = await fetch(`https://jsonplaceholder.typicode.com/users?q=${query}`);
      const data = await response.json();
      
      const transformedResults: Student[] = data.slice(0, 5).map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        class: `Lớp ${Math.floor(Math.random() * 12) + 1}A`,
        email: user.email
      }));
      
      // Lọc ra những học sinh chưa được thêm
      const filteredResults = transformedResults.filter(
        result => !addedStudents.some(student => student.id === result.id)
      );
      
      setSearchResults(filteredResults);
      setError('');
    } catch (err) {
      setError('Không thể tìm kiếm học sinh');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addStudentFromSearch = async (student: Student) => {
    try {
      // Thay thế URL này bằng API endpoint thêm học sinh
      const response = await fetch('https://jsonplaceholder.typicode.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student)
      });

      if (!response.ok) throw new Error('Thêm học sinh thất bại');

      // Thêm vào danh sách đã thêm
      setAddedStudents(prev => [...prev, student]);
      
      // Xóa khỏi kết quả tìm kiếm
      setSearchResults(prev => prev.filter(s => s.id !== student.id));
      
      setError('');
    } catch (err) {
      setError('Không thể thêm học sinh');
      console.error(err);
    }
  };

  const removeStudent = async (id: string) => {
    try {
      // Thay thế URL này bằng API endpoint xóa học sinh
      await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
        method: 'DELETE'
      });

      setAddedStudents(prev => prev.filter(student => student.id !== id));
    } catch (err) {
      setError('Không thể xóa học sinh');
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Quản lý Học sinh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tìm kiếm */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm học sinh để thêm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
            </div>

            {/* Kết quả tìm kiếm */}
            {searchTerm && (
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {searching ? 'Đang tìm kiếm...' : `Kết quả tìm kiếm (${searchResults.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      {searching ? 'Đang tìm...' : 'Không tìm thấy học sinh nào'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold">{student.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {student.class}
                              </Badge>
                              <span className="text-sm text-gray-600">{student.email}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addStudentFromSearch(student)}
                            className="ml-3"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Thêm
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Danh sách học sinh đã thêm */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Học sinh đã thêm ({addedStudents.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải danh sách học sinh...
              </div>
            ) : addedStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có học sinh nào. Sử dụng ô tìm kiếm để thêm học sinh.
              </div>
            ) : (
              <div className="space-y-3">
                {addedStudents.map((student) => (
                  <Card key={student.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{student.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary">{student.class}</Badge>
                          <span className="text-sm text-gray-600">{student.email}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStudent(student.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManager;