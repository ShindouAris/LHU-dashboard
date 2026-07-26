import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Database, Eye, UserCheck, AlertCircle, FileText, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const ChisaAIPrivacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/chisaAI')}
            className="mb-4"
          >
            ← Quay lại ChisaAI
          </Button>
          <h1 className="text-4xl font-display font-bold mb-4 text-foreground">
            Chính sách Bảo mật
          </h1>
          <p className="text-muted-foreground">
            ChisaAI - Trợ lý AI thông minh cho sinh viên LHU
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-[hsl(142_71%_45%)] p-1.5">
                <Shield className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Giới thiệu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              ChisaAI cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. 
              Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn 
              khi sử dụng dịch vụ ChisaAI.
            </p>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-secondary p-1.5">
                <Database className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Thông tin chúng tôi lưu trữ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Thông tin tài khoản</h3>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Tên người dùng, mã sinh viên, lớp và khoa của bạn đang học từ hệ thống LHU</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Dữ liệu cuộc hội thoại</h3>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Nội dung tin nhắn giữa bạn và ChisaAI</li>
                <li>Thời gian và metadata của các cuộc trò chuyện</li>
                <li>Model AI được chọn cho mỗi cuộc trò chuyện</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Dữ liệu kỹ thuật</h3>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Thông tin thiết bị và trình duyệt</li>
                <li>Địa chỉ IP và thông tin kết nối</li>
                <li>Logs hệ thống để khắc phục sự cố</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-[hsl(258_90%_66%)] p-1.5">
                <Eye className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Cách chúng tôi sử dụng thông tin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(258_90%_66%)] mt-2" />
              <p className="text-muted-foreground">
                Cung cấp và cải thiện dịch vụ ChisaAI
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(258_90%_66%)] mt-2" />
              <p className="text-muted-foreground">
                Duy trì và quản lý lịch sử cuộc trò chuyện của bạn
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(258_90%_66%)] mt-2" />
              <p className="text-muted-foreground">
                Phân tích và cải thiện hiệu suất của AI models
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(258_90%_66%)] mt-2" />
              <p className="text-muted-foreground">
                Khắc phục sự cố kỹ thuật và bảo mật hệ thống
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(258_90%_66%)] mt-2" />
              <p className="text-muted-foreground">
                Tuân thủ các yêu cầu pháp lý và quy định
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-destructive p-1.5">
                <Lock className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Bảo mật dữ liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn công nghiệp để bảo vệ dữ liệu của bạn:
            </p>
            <div className="grid gap-3 mt-4">
              <div className="flex items-start gap-3 p-3 bg-muted border-2 border-border rounded-md">
                <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-destructive p-1 flex-shrink-0">
                  <Lock className="w-5 h-5 text-black" strokeWidth={2.5} />
                </span>
                <div>
                  <h4 className="font-semibold">Mã hóa</h4>
                  <p className="text-sm text-muted-foreground">
                    Dữ liệu được mã hóa khi truyền tải (HTTPS) và lưu trữ
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted border-2 border-border rounded-md">
                <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-secondary p-1 flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-black" strokeWidth={2.5} />
                </span>
                <div>
                  <h4 className="font-semibold">Kiểm soát truy cập</h4>
                  <p className="text-sm text-muted-foreground">
                    Chỉ nhân viên được ủy quyền mới có thể truy cập dữ liệu cần thiết
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted border-2 border-border rounded-md">
                <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-primary p-1 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-black" strokeWidth={2.5} />
                </span>
                <div>
                  <h4 className="font-semibold">Giám sát liên tục</h4>
                  <p className="text-sm text-muted-foreground">
                    Hệ thống được giám sát liên tục để phát hiện và ngăn chặn các mối đe dọa
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Third Party Services */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-[hsl(27_96%_61%)] p-1.5">
                <FileText className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Dịch vụ bên thứ ba
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              ChisaAI sử dụng các nhà cung cấp AI models bên thứ ba:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-2">
              <li>OpenAI (GPT models)</li>
              <li>Google (Gemini models)</li>
              <li>DeepSeek, Mistral</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Dữ liệu của bạn có thể được chia sẻ với các nhà cung cấp này để xử lý yêu cầu AI. 
              Mỗi nhà cung cấp có chính sách bảo mật riêng mà bạn nên xem xét.
            </p>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-secondary p-1.5">
                <Database className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Lưu trữ dữ liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Chúng tôi lưu trữ dữ liệu của bạn trong các khoảng thời gian sau:
            </p>
            <div className="space-y-2 ml-4">
              <div className="flex gap-2">
                <span className="font-semibold min-w-[150px]">Lịch sử chat:</span>
                <span className="text-muted-foreground">Cho đến khi bạn xóa hoặc yêu cầu xóa</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[150px]">Logs hệ thống:</span>
                <span className="text-muted-foreground">5 ngày</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[150px]">Dữ liệu tài khoản:</span>
                <span className="text-muted-foreground">Trong suốt thời gian tài khoản hoạt động</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-[hsl(142_71%_45%)] p-1.5">
                <UserCheck className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Quyền của bạn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground mb-3">
              Bạn có các quyền sau đối với dữ liệu cá nhân của mình:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(142_71%_45%)] mt-2" />
                <p className="text-muted-foreground">
                  <strong>Quyền truy cập:</strong> Yêu cầu bản sao dữ liệu của bạn
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(142_71%_45%)] mt-2" />
                <p className="text-muted-foreground">
                  <strong>Quyền xóa:</strong> Yêu cầu xóa dữ liệu cá nhân của bạn
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(142_71%_45%)] mt-2" />
                <p className="text-muted-foreground">
                  <strong>Quyền sửa đổi:</strong> Cập nhật hoặc sửa đổi thông tin của bạn
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-border bg-[hsl(142_71%_45%)] mt-2" />
                <p className="text-muted-foreground">
                  <strong>Quyền hạn chế:</strong> Yêu cầu hạn chế xử lý dữ liệu của bạn
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-secondary p-1.5">
                <Mail className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Liên hệ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3">
              Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này hoặc muốn thực hiện quyền của mình, 
              vui lòng liên hệ với chúng tôi:
            </p>
            <div className="space-y-2 text-muted-foreground ml-4">
              <p><strong>Discord Server:</strong> <a href='https://discord.chisadin.site' className='font-bold underline underline-offset-4 text-foreground cursor-pointer hover:opacity-70'>Chisadin chan's playfield</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center border-2 border-border rounded-md bg-[hsl(27_96%_61%)] p-1.5">
                <AlertCircle className="w-5 h-5 text-black" strokeWidth={2.5} />
              </span>
              Thay đổi chính sách
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. 
              Mọi thay đổi sẽ được thông báo trên trang này với ngày cập nhật mới. 
              Chúng tôi khuyến khích bạn xem xét chính sách này định kỳ để cập nhật thông tin 
              về cách chúng tôi bảo vệ dữ liệu của bạn.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 border-t-2 border-border">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ChisaAI - LHU Dashboard. Bảo lưu mọi quyền.
          </p>
          <Button
            variant="link"
            onClick={() => navigate('/chisaAI')}
            className="mt-2"
          >
            Quay lại ChisaAI
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChisaAIPrivacy;
