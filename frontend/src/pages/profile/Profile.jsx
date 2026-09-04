import React, { useState } from "react";
import { toast } from "sonner";
import { Save, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import api from "@/utils/api";

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    contact: user?.contact || "",
    address: user?.address || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put("/auth/update-profile", {
        name: profileData.name,
        contact: profileData.contact,
        address: profileData.address,
      });
      toast.success("Profile updated successfully!");
      // If we have a mechanism to update local user state without full reload:
      if (res.data?.user) {
        // localStorage.setItem("user", JSON.stringify(res.data.user)); // Depending on AuthContext implementation
        window.location.reload(); // Simple fallback
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put("/auth/update-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-4xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and security settings."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general" className="gap-2"><UserIcon size={16} aria-hidden="true"/> General</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Lock size={16} aria-hidden="true"/> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your contact details and name.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input id="profile-name" name="name" value={profileData.name} onChange={handleProfileChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email (Read-only)</Label>
                    <Input id="profile-email" value={user?.email || ""} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-role">Role</Label>
                    <Input id="profile-role" value={user?.role?.toUpperCase() || ""} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-contact">Phone Number</Label>
                    <Input id="profile-contact" name="contact" value={profileData.contact} onChange={handleProfileChange} placeholder="e.g. +92 300 1234567" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profile-address">Address</Label>
                    <Input id="profile-address" name="address" value={profileData.address} onChange={handleProfileChange} placeholder="Full address" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={profileLoading} className="gap-2">
                    {profileLoading ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Save size={16} aria-hidden="true" />
                    )}
                    {profileLoading ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required minLength={6} />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={passwordLoading || !passwordData.currentPassword} className="gap-2">
                    {passwordLoading ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Lock size={16} aria-hidden="true" />
                    )}
                    {passwordLoading ? "Updating…" : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
