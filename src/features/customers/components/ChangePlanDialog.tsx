import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlanOptions } from "@/hooks/usePlanOptions";
import type { Customer } from "@/schemas/customer";

import { useChangePlan } from "../hooks/useCustomers";

type Props = {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePlanDialog({ customer, open, onOpenChange }: Props) {
  const { data: planOptions } = usePlanOptions();
  const change = useChangePlan(customer.id);
  const [planId, setPlanId] = useState<string>(customer.planId);

  const handleSubmit = async () => {
    try {
      await change.mutateAsync({ planId });
      onOpenChange(false);
    } catch {
      // useChangePlan surfaces a toast.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ganti paket</DialogTitle>
          <DialogDescription>
            Paket sekarang:{" "}
            <span className="font-medium">{customer.planName}</span>. Selisih
            harga dihitung prorata untuk sisa bulan ini dan ditagihkan otomatis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger className="w-full" aria-label="Paket baru">
              <SelectValue placeholder="Pilih paket" />
            </SelectTrigger>
            <SelectContent>
              {(planOptions ?? []).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={change.isPending}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={change.isPending || planId === customer.planId}
          >
            {change.isPending ? "Memproses…" : "Ganti paket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
