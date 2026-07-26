import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Moon, Sun, Calendar, GraduationCap, MapPin } from 'lucide-react';

const SECTIONS = [
  'schedule',
  'timetable',
  'mark',
  'diemdanh',
  'qrscan',
  'parking',
  'settings',
] as const;

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg uppercase tracking-wide">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

/**
 * Internal /styleguide sandbox — visual QA for the neobrutalism primitives.
 * Not linked in nav; open /styleguide directly.
 */
export default function StyleGuide() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [section, setSection] = useState<(typeof SECTIONS)[number]>('schedule');

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(document.documentElement.classList.contains('dark'));
  };

  return (
    <div data-section={section} className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Header / controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-border bg-section p-5 text-section-foreground shadow-brutal rounded-md">
          <div>
            <p className="font-black text-3xl">NEOBRUTALISM STYLEGUIDE</p>
            <p className="font-medium">LHU Dashboard — primitive sandbox</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as typeof section)}
              className="h-10 rounded-md border-2 border-border bg-background px-3 font-bold text-foreground"
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button variant="outline" size="icon" onClick={toggleDark}>
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>

        {/* Typography */}
        <Row title="Typography">
          <div className="w-full space-y-1">
            <p className="font-black text-4xl">Archivo Black display 40</p>
            <h1 className="text-3xl">Space Grotesk H1</h1>
            <h2 className="text-2xl">Space Grotesk H2</h2>
            <p className="text-base">Inter body — Sinh viên Lạc Hồng quản lý lịch học.</p>
            <p className="font-mono text-sm">JetBrains Mono — MSSV 421000123 · 07:00</p>
            <p className="font-black text-2xl tabular-nums">3.75 GPA · 92%</p>
          </div>
        </Row>

        {/* Colors */}
        <Row title="Palette">
          {[
            ['primary', 'bg-primary text-primary-foreground'],
            ['secondary', 'bg-secondary text-secondary-foreground'],
            ['section', 'bg-section text-section-foreground'],
            ['destructive', 'bg-destructive text-destructive-foreground'],
            ['muted', 'bg-muted text-foreground'],
            ['card', 'bg-card text-card-foreground'],
          ].map(([name, cls]) => (
            <div
              key={name}
              className={`flex h-16 w-28 items-center justify-center rounded-md border-2 border-border font-bold shadow-brutal-sm ${cls}`}
            >
              {name}
            </div>
          ))}
        </Row>

        {/* Buttons */}
        <Row title="Buttons">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="section">Section</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="calendar">
            <Calendar />
          </Button>
        </Row>

        {/* Badges */}
        <Row title="Badges">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="section">Section</Badge>
          <Badge variant="success">Có mặt</Badge>
          <Badge variant="destructive">Vắng</Badge>
          <Badge variant="outline">Outline</Badge>
        </Row>

        {/* Form controls */}
        <Row title="Form controls">
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sg-in">Mã số sinh viên</Label>
              <Input id="sg-in" placeholder="421000123" />
              <Textarea placeholder="Ghi chú..." />
            </div>
            <div className="space-y-3">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Học kỳ 1</SelectItem>
                  <SelectItem value="2">Học kỳ 2</SelectItem>
                  <SelectItem value="3">Học kỳ 3</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox id="sg-cb" defaultChecked />
                <Label htmlFor="sg-cb">Ghi nhớ đăng nhập</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="sg-sw" defaultChecked />
                <Label htmlFor="sg-sw">Chế độ tối</Label>
              </div>
            </div>
          </div>
        </Row>

        {/* Cards */}
        <Row title="Cards">
          <Card className="w-72">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap /> Toán cao cấp
              </CardTitle>
              <CardDescription>07:00 — 09:30 · Thứ 2</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm">
              <MapPin className="size-4" /> Phòng A1.201
            </CardContent>
            <CardFooter>
              <Button variant="section" size="sm">
                Xem bản đồ
              </Button>
            </CardFooter>
          </Card>
          <Card className="brutal-hover w-72 cursor-pointer">
            <CardHeader>
              <CardTitle>Clickable (press)</CardTitle>
              <CardDescription>Hover me — I shift into my shadow.</CardDescription>
            </CardHeader>
          </Card>
        </Row>

        {/* Tabs */}
        <Row title="Tabs">
          <Tabs defaultValue="a" className="w-full">
            <TabsList>
              <TabsTrigger value="a">Hôm nay</TabsTrigger>
              <TabsTrigger value="b">Tuần</TabsTrigger>
              <TabsTrigger value="c">Tháng</TabsTrigger>
            </TabsList>
            <TabsContent value="a">Nội dung hôm nay.</TabsContent>
            <TabsContent value="b">Nội dung tuần.</TabsContent>
            <TabsContent value="c">Nội dung tháng.</TabsContent>
          </Tabs>
        </Row>

        {/* Table */}
        <Row title="Table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Môn học</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Xếp loại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Toán cao cấp</TableCell>
                <TableCell className="tabular-nums">8.5</TableCell>
                <TableCell>
                  <Badge variant="success">A</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Lập trình Web</TableCell>
                <TableCell className="tabular-nums">9.0</TableCell>
                <TableCell>
                  <Badge variant="success">A+</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Row>

        {/* Dialog + Skeleton */}
        <Row title="Dialog & Skeleton">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Mở hộp thoại</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận đăng ký</DialogTitle>
                <DialogDescription>
                  Bạn có chắc muốn đăng ký thi lại môn này không?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Hủy</Button>
                <Button>Xác nhận</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Row>
      </div>
    </div>
  );
}
