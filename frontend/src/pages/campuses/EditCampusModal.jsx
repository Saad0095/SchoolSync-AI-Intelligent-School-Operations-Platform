import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { updateCampus } from "@/services/campusService";
import { getUsers } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EditCampusModal = ({ campus, onUpdated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    campusAdmin: "",
  });

  // Load existing campus data into form when modal opens
  useEffect(() => {
    if (open && campus) {
      setForm({
        name: campus.name || "",
        code: campus.code || "",
        address: campus.address || "",
        city: campus.city || "",
        phone: campus.contact?.phone || "",
        email: campus.contact?.email || "",
        latitude: campus.location?.coordinates?.[1] || "",
        longitude: campus.location?.coordinates?.[0] || "",
        campusAdmin: campus.campusAdmin?._id || "",
      });
    }
  }, [open, campus]);

  // Fetch available admins when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchAdmins = async () => {
      try {
        const res = await getUsers({ role: "campus-admin", limit: 100 });
        setAdmins(res.data?.users || []);
      } catch {
        setAdmins([]);
      }
    };
    fetchAdmins();
  }, [open]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateCampus(campus._id, {
        name: form.name,
        code: form.code,
        address: form.address,
        city: form.city,
        location: {
          type: "Point",
          coordinates: [
            Number(form.longitude || 0),
            Number(form.latitude || 0),
          ],
        },
        contact: {
          phone: form.phone,
          email: form.email,
        },
        campusAdmin: form.campusAdmin || undefined,
      });
      toast.success("Campus updated successfully");
      setOpen(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update campus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1"
      >
        <Pencil size={14} aria-hidden="true" />
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Campus</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-campus-name">Campus Name *</Label>
                <Input
                  id="edit-campus-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-campus-code">Campus Code</Label>
                <Input
                  id="edit-campus-code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-campus-address">Address</Label>
              <Input id="edit-campus-address" name="address" value={form.address} onChange={handleChange} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-campus-city">City</Label>
              <Input id="edit-campus-city" name="city" value={form.city} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-campus-phone">Phone</Label>
                <Input id="edit-campus-phone" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-campus-email">Email</Label>
                <Input
                  id="edit-campus-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-campus-latitude">Latitude</Label>
                <Input
                  id="edit-campus-latitude"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 31.5204"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-campus-longitude">Longitude</Label>
                <Input
                  id="edit-campus-longitude"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 74.3587"
                />
              </div>
            </div>

            {admins.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="edit-campus-admin">Campus Admin</Label>
                <Select
                  value={form.campusAdmin}
                  onValueChange={(v) => setForm({ ...form, campusAdmin: v })}
                >
                  <SelectTrigger id="edit-campus-admin">
                    <SelectValue placeholder="Select admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map((a) => (
                      <SelectItem key={a._id} value={a._id}>
                        {a.name} ({a.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditCampusModal;
