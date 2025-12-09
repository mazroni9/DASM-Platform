"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type: string;
}

interface ManageOrganizationMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
  organizationName: string;
}

export function ManageOrganizationMembersDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: ManageOrganizationMembersDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Add Member State
  const [isAdding, setIsAdding] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    if (open && organizationId) {
      fetchMembers();
    } else {
      setMembers([]);
      setSearchTerm("");
      setIsAdding(false);
      setUserSearch("");
      setSearchResults([]);
      setSelectedUserId("");
    }
  }, [open, organizationId]);

  // Search users when adding new member
  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearch.trim() || userSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchingUsers(true);
      try {
        const response = await api.get(`/api/admin/users?search=${userSearch}`);
        if (response.data && response.data.data) {
          // Handle both paginated and non-paginated responses
          const users = response.data.data.data || response.data.data;
          setSearchResults(users);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setSearchingUsers(false);
      }
    };

    const debounce = setTimeout(searchUsers, 500);
    return () => clearTimeout(debounce);
  }, [userSearch]);

  const fetchMembers = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const response = await api.get(
        `/api/admin/organizations/${organizationId}/members`
      );
      if (response.data && response.data.data) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("فشل في تحميل قائمة الأعضاء");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!organizationId || !selectedUserId) return;

    try {
      await api.post(`/api/admin/organizations/${organizationId}/members`, {
        user_id: selectedUserId,
      });
      toast.success("تم إضافة العضو بنجاح");
      setIsAdding(false);
      setSelectedUserId("");
      setUserSearch("");
      fetchMembers();
    } catch (error: any) {
      console.error("Error adding member:", error);
      const msg = error.response?.data?.message || "فشل في إضافة العضو";
      toast.error(msg);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!organizationId) return;

    if (!confirm("هل أنت متأكد من إزالة هذا العضو من المنظمة؟")) return;

    try {
      await api.delete(
        `/api/admin/organizations/${organizationId}/members/${userId}`
      );
      toast.success("تم إزالة العضو بنجاح");
      fetchMembers();
    } catch (error: any) {
      console.error("Error removing member:", error);
      const msg = error.response?.data?.message || "فشل في إزالة العضو";
      toast.error(msg);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>إدارة أعضاء - {organizationName}</DialogTitle>
          <DialogDescription>
            يمكنك إضافة أو إزالة الأعضاء من هذه المنظمة.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between my-4 gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="بحث في الأعضاء..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            variant={isAdding ? "secondary" : "default"}
          >
            {isAdding ? (
              <>
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 ml-2" />
                إضافة عضو
              </>
            )}
          </Button>
        </div>

        {isAdding && (
          <div className="bg-muted/50 p-4 rounded-lg mb-4 border border-border">
            <h4 className="text-sm font-medium mb-3">إضافة عضو جديد</h4>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستخدم..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 sticky top-0 bg-background z-10 border-b">
                      <Input
                        placeholder="ابحث بالاسم أو البريد..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="mb-2"
                      />
                      {searchingUsers && (
                        <p className="text-xs text-muted-foreground text-center">
                          جاري البحث...
                        </p>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {searchResults.length === 0 && !searchingUsers && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          لا توجد نتائج
                        </div>
                      )}
                      {searchResults.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.email})
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} disabled={!selectedUserId}>
                إضافة
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الدور</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    لا يوجد أعضاء في هذه المنظمة
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.first_name} {member.last_name}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
