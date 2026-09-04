import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";

const AddCampus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    const fetchAdmins = async () => {
      setAdminsLoading(true);
      try {
        const [usersRes, assignedAdminsRes] = await Promise.all([
          api.get("/auth/users", { params: { role: "campus-admin", limit: 100 } }),
          api.get("/campuses/admins"),
        ]);
        // api interceptor already returns response.data
        // usersRes = { users: [...], total, page, limit }
        // assignedAdminsRes = [ObjectId, ObjectId, ...]
        const allCampusAdmins = usersRes?.users || [];
        const assignedArr = Array.isArray(assignedAdminsRes) ? assignedAdminsRes : [];
        const assignedSet = new Set(assignedArr.map(String));

        const unassigned = allCampusAdmins.filter(
          (u) => !assignedSet.has(String(u._id))
        );

        setAdmins(unassigned);

        if (unassigned.length === 1) {
          setFormData((prev) => ({
            ...prev,
            campusAdmin: unassigned[0]._id,
          }));
        }
      } catch (error) {
        toast.error("Failed to load available campus admins");
        console.error("Failed to load campus admins", error);
      } finally {
        setAdminsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/campuses", {
        name: formData.name,
        code: formData.code,
        address: formData.address,
        city: formData.city,
        location: {
          type: "Point",
          coordinates: [
            Number(formData.longitude || 0),
            Number(formData.latitude || 0),
          ],
        },
        contact: {
          phone: formData.phone,
          email: formData.email,
        },
        campusAdmin: formData.campusAdmin,
      });

      toast.success(`Campus "${formData.name}" created successfully!`);
      navigate("/admin/campuses");
    } catch (error) {
      const errData = error?.response?.data;
      const msg = (typeof errData?.message === "string" ? errData.message : null) ||
                  (typeof errData?.error === "string" ? errData.error : null) ||
                  "Failed to create campus";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/campuses")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to Campuses
      </Button>

      <PageHeader
        eyebrow="Campuses"
        title="Add New Campus"
        subtitle="Register a new campus and assign an admin to manage it."
      />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="campus-name">Campus Name *</Label>
                <Input
                  id="campus-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Main Campus"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="campus-code">Campus Code *</Label>
                <Input
                  id="campus-code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="e.g. MC-001"
                />
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="campus-address">Address *</Label>
              <Input
                id="campus-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Full street address"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="campus-city">City *</Label>
              <Input
                id="campus-city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="e.g. Karachi"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="campus-phone">Phone *</Label>
                <Input
                  id="campus-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+92 300 0000000"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="campus-email">Email *</Label>
                <Input
                  id="campus-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="campus@school.edu"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="campus-latitude">Latitude</Label>
                <Input
                  id="campus-latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 24.8607"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="campus-longitude">Longitude</Label>
                <Input
                  id="campus-longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 67.0011"
                />
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor="campus-admin">Campus Admin *</Label>
              {adminsLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/40 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Loading available admins…
                </div>
              ) : admins.length === 0 ? (
                <div className="flex items-center h-10 px-3 rounded-md border border-warning/30 bg-warning/10 text-sm font-medium text-warning">
                  No unassigned campus admins found. Create a campus-admin user first.
                </div>
              ) : (
                <Select
                  value={formData.campusAdmin}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, campusAdmin: v }))}
                >
                  <SelectTrigger id="campus-admin" className="w-full">
                    <SelectValue placeholder="Select a campus admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map((admin) => (
                      <SelectItem key={admin._id} value={admin._id}>
                        {admin.name} — {admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!adminsLoading && admins.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {admins.length} unassigned campus admin{admins.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/admin/campuses")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.campusAdmin}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  "Create Campus"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCampus;
