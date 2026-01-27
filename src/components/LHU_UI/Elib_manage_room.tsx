import { useState, useEffect } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ELIB_SERVICE } from '@/services/elibService';
import { UserObjFromDK_DocGia_SelectByDangKyID, UserSearch } from '@/types/elib';
import toast from 'react-hot-toast';

interface StudentManagerProps {
  dangKyID: string;
  onClose: () => void;
}

const StudentManager = ({ dangKyID, onClose }: StudentManagerProps) => {
  const [addedStudents, setAddedStudents] = useState<UserObjFromDK_DocGia_SelectByDangKyID[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Fetch danh sách học sinh đã thêm ban đầu
  useEffect(() => {
    fetchInitialStudents();
  }, [dangKyID]);

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
      const response = await ELIB_SERVICE.get_members_by_dangky_id(dangKyID);
      
      if (response && response.data) {
        setAddedStudents(response.data);
      }
      
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
      const response = await ELIB_SERVICE.search_user(query);
      
      if (response && response.data) {
        // Lọc ra những học sinh chưa được thêm
        const filteredResults = response.data.filter(
          result => !addedStudents.some(student => student.StudentID === result.ObjectID)
        );
        
        setSearchResults(filteredResults);
      }
      
      setError('');
    } catch (err) {
      setError('Không thể tìm kiếm học sinh');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addStudentFromSearch = async (student: UserSearch) => {
    try {
      const result = await ELIB_SERVICE.add_member_to_room(dangKyID, student.ObjectID);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success('Thêm thành viên thành công');
      
      // Refresh danh sách
      await fetchInitialStudents();
      
      // Xóa khỏi kết quả tìm kiếm
      setSearchResults(prev => prev.filter(s => s.ObjectID !== student.ObjectID));
      
      setError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể thêm học sinh';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    }
  };

  const removeStudent = async (studentId: string) => {
    try {
      const result = await ELIB_SERVICE.remove_member_from_room(dangKyID, studentId);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success('Xóa thành viên thành công');
      setAddedStudents(prev => prev.filter(student => student.StudentID !== studentId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể xóa học sinh';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              Quản lý Thành viên
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Đóng
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tìm kiếm */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm học sinh để thêm (nhập tên hoặc MSSV)..."
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
                          key={student.ObjectID}
                          className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold">{student.ObjectName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {student.ObjectNickName}
                              </Badge>
                              <span className="text-sm text-gray-600">{student.Description}</span>
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
              Thành viên đã thêm ({addedStudents.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải danh sách thành viên...
              </div>
            ) : addedStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có thành viên nào. Sử dụng ô tìm kiếm để thêm thành viên.
              </div>
            ) : (
              <div className="space-y-3">
                {addedStudents.map((student) => (
                  <Card key={student.StudentID} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {student.FirstName} {student.LastName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary">{student.StudentID}</Badge>
                          {student.Email && (
                            <span className="text-sm text-gray-600">{student.Email}</span>
                          )}
                          {student.DepartmentName && (
                            <span className="text-sm text-gray-600">{student.DepartmentName}</span>
                          )}
                        </div>
                        {student.ThoiGianXacNhan && (
                          <div className="text-xs text-green-600 mt-1">
                            ✓ Đã xác nhận lúc {new Date(student.ThoiGianXacNhan).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStudent(student.StudentID)}
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