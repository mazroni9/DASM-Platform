"use client"

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface MoveToLiveDialogProps {
  open: boolean;
  onClose: () => void;
  carIds: number[];
  onSuccess: () => void;
}

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: string;
}

export function MoveToLiveDialog({ open, onClose, carIds, onSuccess }: MoveToLiveDialogProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [sessions, setSessions] = useState<AuctionSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/sessions/active-scheduled');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load auction sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSessionId) {
      toast.error('Please select an auction session');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put("/api/admin/auctions/bulk/move-to-status", {
        ids: carIds,
        status: "live",
        session_id: parseInt(selectedSessionId)
      });
      
      toast.success(response.data.message || 'Cars moved to live auction successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error moving cars to live:', error);
      toast.error('Failed to move cars to live auction');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      //hour: '2-digit',
      //minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>نقل إلى المزاد المباشر</DialogTitle>
          <DialogDescription>
            اختر جلسة المزاد لنقل السيارات المحددة ({carIds.length} سيارة) إلى المزاد المباشر
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="session" className="text-right">
              جلسة المزاد
            </Label>
            <div className="col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-10">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <Select
                  value={selectedSessionId}
                  onValueChange={setSelectedSessionId}
                  disabled={submitting}
                >
                  <SelectTrigger id="session">
                    <SelectValue placeholder="اختر جلسة المزاد" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        لا توجد جلسات متاحة
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id.toString()}>
                          <div className="flex flex-col">
                            <span>{session.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(session.session_date)} - {session.status === 'active' ? 'نشط' : 'مجدول'}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedSessionId || loading}>
            {submitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري النقل...
              </>
            ) : (
              'نقل إلى المزاد المباشر'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
