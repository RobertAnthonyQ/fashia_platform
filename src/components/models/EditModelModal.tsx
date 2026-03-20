"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type FashionModel = Database["public"]["Tables"]["fashion_models"]["Row"];

interface EditModelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: FashionModel | null;
  onSuccess: () => void;
}

export function EditModelModal({
  open,
  onOpenChange,
  model,
  onSuccess,
}: EditModelModalProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<string>("female");
  const [country, setCountry] = useState("");
  const [age, setAge] = useState<string>("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (model) {
      setName(model.name);
      setGender(model.gender);
      setCountry(model.country ?? "");
      setAge(model.age?.toString() ?? "");
      setStyle(model.style ?? "");
    }
  }, [model]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!model || !name.trim()) return;

    setLoading(true);
    const res = await fetch(`/api/models/${model.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        gender,
        country: country.trim() || undefined,
        age: age ? Number(age) : undefined,
        style: style.trim() || undefined,
      }),
    });

    setLoading(false);
    if (res.ok) {
      toast.success("Model updated");
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to update model");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-50 font-heading">
            Edit Model
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-zinc-300">
              Name *
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Gender *</Label>
            <Select
              value={gender}
              onValueChange={(v) => {
                if (v) setGender(v);
              }}
            >
              <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="non_binary">Non-binary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-country" className="text-zinc-300">
                Country
              </Label>
              <Input
                id="edit-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-age" className="text-zinc-300">
                Age
              </Label>
              <Input
                id="edit-age"
                type="number"
                min={16}
                max={80}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-style" className="text-zinc-300">
              Style
            </Label>
            <Textarea
              id="edit-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              rows={3}
              className="border-zinc-700 bg-zinc-800 text-zinc-100 rounded-lg resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-[#BEFF00] text-black hover:bg-[#BEFF00]/90 font-semibold rounded-lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
