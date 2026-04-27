"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";

const ROLES = [
  { value: "patient", label: "Patients" },
  { value: "corporate", label: "Corporates" },
  { value: "hospital", label: "Hospitals" },
  { value: "insurer", label: "Insurers" },
  { value: "admin", label: "Admins" },
];

export default function AdminSettingsPage() {
  // Broadcast form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("info");
  const [targetRoles, setTargetRoles] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggleRole = (role: string) => {
    setTargetRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setResult({ type: "error", text: "Title and message are required" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await apiFetch<{ sent: number }>("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          severity,
          targetRoles: targetRoles.size > 0 ? Array.from(targetRoles) : undefined,
        }),
      });
      setResult({ type: "success", text: `Notification sent to ${res.data.sent} user${res.data.sent !== 1 ? "s" : ""}` });
      setTitle("");
      setMessage("");
      setSeverity("info");
      setTargetRoles(new Set());
    } catch (err) {
      setResult({ type: "error", text: err instanceof Error ? err.message : "Failed to send" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">System Settings</h1>
        <p className="text-gray-500">Manage system configuration and broadcast messages</p>
      </div>

      {/* Broadcast Notification */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Broadcast Notification</h2>
        <p className="text-sm text-gray-500 mb-6">Send a system-wide announcement to all users or specific roles.</p>

        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${result.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            {result.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Scheduled Maintenance Tonight"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write your announcement message..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <div className="flex gap-3">
              {(["info", "warning", "critical"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    severity === s
                      ? s === "info"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : s === "warning"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Roles <span className="text-gray-400 font-normal">(leave empty for all users)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => toggleRole(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    targetRoles.has(r.value)
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleBroadcast}
              disabled={sending || !title.trim() || !message.trim()}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Broadcast"}
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Platform</p>
            <p className="text-sm font-medium text-gray-900">InsureLink v1.0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Backend</p>
            <p className="text-sm font-medium text-gray-900">NestJS + PostgreSQL</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Frontend</p>
            <p className="text-sm font-medium text-gray-900">Next.js + React</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Real-time</p>
            <p className="text-sm font-medium text-gray-900">Socket.io</p>
          </div>
        </div>
      </div>
    </div>
  );
}
