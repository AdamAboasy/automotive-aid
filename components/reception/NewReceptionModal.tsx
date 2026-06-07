import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface NewReceptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewReceptionModal({ open, onOpenChange }: NewReceptionModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Connect to Supabase
    alert('تم تسجيل السيارة بنجاح!')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>استقبال سيارة جديدة</DialogTitle>
          <DialogDescription>
            أدخل بيانات العميل والسيارة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم العميل</Label>
              <Input placeholder="أحمد محمد" required />
            </div>
            <div className="space-y-2">
              <Label>رقم التليفون</Label>
              <Input type="tel" placeholder="01012345678" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم اللوحة</Label>
              <Input placeholder="1234 ABC" required />
            </div>
            <div className="space-y-2">
              <Label>الموديل</Label>
              <Input placeholder="تويوتا كورولا 2023" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>وصف المشكلة</Label>
            <Textarea placeholder="السيارة بتعمل صوت غريب من الموتور..." rows={4} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الخدمة</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الخدمة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">صيانة دورية</SelectItem>
                  <SelectItem value="repair">إصلاح</SelectItem>
                  <SelectItem value="emergency">طوارئ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الفني المسؤول</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فني" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">محمد علي</SelectItem>
                  <SelectItem value="2">أحمد حسن</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">تسجيل الاستقبال</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
