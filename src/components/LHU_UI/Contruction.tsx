import { CardContent } from "../ui/card";
import { Card_11 } from "../ui/card-11";

export const Construction: React.FC = () => {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-secondary rounded-md">
            <Card_11>
                <CardContent className="p-6 text-center">
                    <div className='text-foreground text-2xl font-display font-black'>🚧 Khu vực đang thi công</div>
                    <p className="text-sm text-muted-foreground sm:text-base">
                    Trang này đang được xây dựng. <br />
                    Bạn có thể quay lại sau hoặc thử các tính năng khác.
                    </p>
                </CardContent>
            </Card_11>
        </div>
    );
}

// Backwards-compatible export for existing imports.
export const Contruction = Construction;

export const NotAvailable: React.FC<{ page_name: string }> = ({ page_name }) => {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-destructive rounded-md">
            <Card_11>
                <CardContent className="p-6 text-center">
                    <div className='text-destructive text-2xl font-display font-black'>⛔ Trang không khả dụng</div>
                    <p className="text-sm text-muted-foreground sm:text-base">
                    Bạn đã bị chặn truy cập vào {page_name}. <br />
                    Hãy làm mới trang.
                    </p>
                </CardContent>
            </Card_11>
        </div>
    );
}