import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Trash2, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { drlService } from '@/services/diemrenluyenService';
import { FileItem, LinkItem } from '@/types/drl';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter } from '../ui/dialog';
import { LuFileQuestion } from "react-icons/lu";
import { Empty,  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle, } from '../ui/empty';
import { Link } from 'react-router-dom';
import { LoadingScreen } from '../LHU_UI/LoadingScreen';

export const FileManager = ({hoatdongID=null, onClose}: {hoatdongID: number | null; onClose: () => void;}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [uploadLinkModalOpen, setUploadLinkModalOpen] = useState<boolean>(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  const [link, setLink] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);


  const handleDeleteFile = async (id: number | null) => {
    if (id === null) return;
    try {
      const isDeleted = await drlService.deleteFile(id);
      if (isDeleted) {
        setFiles(files.filter((file) => file.FileID !== id));
        toast.success("Xóa tập tin thành công");
      } else {
        toast.error("Xóa tập tin thất bại");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi xóa tập tin");
    }
  };

  const fetchData = async () => {
      setLoading(true);
      try {
        if (hoatdongID === null) {
          throw new Error("Hoạt động không hợp lệ.");
        }
        const fetchedFiles = await drlService.getActivityProofUploadFiles(hoatdongID);
        const fetchedLinks = await drlService.getActivityProofText(hoatdongID);
        setFiles(fetchedFiles.data);
        setLinks(fetchedLinks.data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading files and links:", error);
        toast.error("Đã xảy ra lỗi khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => {
    
    fetchData()
    return () => {
      setFiles([]);
      setLinks([]);
      setLoading(false);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (uploadedFiles && hoatdongID !== null) {
      Array.from(uploadedFiles).forEach(async (file) => {
        try {
          await drlService.uploadFile(file, hoatdongID);
          toast.success(`Tải lên tập tin ${file.name} thành công`);
          await fetchData(); // Làm mới danh sách tập tin sau khi tải lên
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error(`Tải lên tập tin ${file.name} thất bại`);
        }
      });
    }
  };

  const handleAddLink = () => {
  };

  const loadImagePreview = (binaryContent: string) => {
    const byteCharacters = atob(binaryContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const imageUrl = URL.createObjectURL(blob);
    setImagePreview(imageUrl);
    setImageModalOpen(true);
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingScreen loading={loading} />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between dark:bg-blue-700">
        <h1 className="text-lg font-medium">Quản lý tập tin minh chứng</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-blue-700 dark:hover:bg-blue-800"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogDescription>
            Bạn có chắc chắn muốn xoá tập tin này không?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => {setConfirmDeleteOpen(false); setSelectedFileId(null);}}>Huỷ</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteFile(selectedFileId)}>Xoá</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] p-0">
          <DialogHeader>Xem ảnh minh chứng</DialogHeader>
          <DialogDescription className="p-0">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
          </DialogDescription>
        </DialogContent>

      </Dialog>

      <Dialog open={uploadLinkModalOpen} onOpenChange={setUploadLinkModalOpen}>
        <DialogContent>
          <DialogHeader>Tải lên / sửa link minh chứng</DialogHeader>
          <DialogDescription>
            <div className="flex flex-col gap-4">
              <Input placeholder="Nhập link minh chứng..." value={link} onChange={(e) => setLink(e.target.value)} />
              <Input placeholder="Ghi chú (tuỳ chọn)..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadLinkModalOpen(false)}>Huỷ</Button>
            <Button>Thêm link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-6">
        {/* Files Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm mb-6">
          <div className="border-b dark:border-gray-800 px-6 py-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">File minh chứng</h2>
            <div hidden={files.length < 1}>
              <Button
                onClick={() => inputRef.current?.click()}
                variant={'outline'}
              >
                <Upload className="h-4 w-4 mr-2" />
                TẢI TẬP TIN
              </Button>

              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="justify-center dark:text-gray-200">Tên tập tin</TableHead>
                <TableHead className="text-right dark:text-gray-200">Cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="p-0">
                    <Empty className="w-full py-16">
                      <EmptyHeader>
                        <EmptyMedia>
                          <LuFileQuestion className="h-12 w-12 text-black dark:text-gray-100" />
                        </EmptyMedia>
                        <EmptyTitle className='text-black dark:text-gray-100'>Chưa có tập tin minh chứng</EmptyTitle>
                        <EmptyDescription className='text-black dark:text-gray-300'>
                          Hãy tải lên tập tin minh chứng cho hoạt động này.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <div className="mt-4">
                          <Button
                            onClick={() => inputRef.current?.click()}
                            variant={'outline'}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            TẢI TẬP TIN
                          </Button>

                          <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </div>
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
              {files.map((file) => (
                <TableRow key={file.FileID}>
                  <TableCell
                      className="text-blue-600 hover:underline text-left cursor-pointer"
                      onClick={() => loadImagePreview(file.BinaryContent)}
                    >
                      {file.FileName}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {setConfirmDeleteOpen(true); setSelectedFileId(file.FileID);}}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Links Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
          <div className="border-b dark:border-gray-800 px-6 py-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Link</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddLink}
              className="rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] dark:text-gray-200">Link</TableHead>
                <TableHead className="w-[40%] dark:text-gray-200">Ghi chú</TableHead>
                <TableHead className="text-right dark:text-gray-200">Cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-400 dark:text-gray-500">
                    Không có dữ liệu...
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.STT}>
                    <TableCell className="text-blue-600 hover:underline text-left cursor-pointer">
                      <Link to={link.Link} target="_blank" className="text-blue-600 hover:underline">
                        {link.Link}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-left text-black dark:text-gray-100">
                        {link.Note || "Không có ghi chú"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {}}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-200 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                    >
                        <Edit2 size={18} />
                    </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}