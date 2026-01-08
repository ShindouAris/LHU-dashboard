import { CardContent } from "../ui/card";
import { Card_11 } from "../ui/card-11";

export const Construction: React.FC = () => {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-b from-pink-300 to-cyan-300 dark:from-pink-500 dark:to-sky-600 rounded-lg">
            <Card_11>
                <CardContent className="p-6 text-center">
                    <div className='text-pink-400 text-2xl font-bold'>🚧 Khu vực đang thi công</div>
                    <p className="text-sm text-gray-600 dark:text-white sm:text-base">
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