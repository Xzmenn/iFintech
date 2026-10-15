"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { data } = useSession();
  const name = data?.user?.name || "Pengguna";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 rounded-full px-2">
          <Avatar className="size-8">
            <AvatarImage src={data?.user?.image || undefined} alt={name} />
            <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal">
          <span className="block font-medium">{name}</span>
          <span className="text-muted-foreground text-xs">{data?.user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings?tab=profil">
            <UserRound className="mr-2 size-4" /> Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 size-4" /> Pengaturan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 size-4" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
