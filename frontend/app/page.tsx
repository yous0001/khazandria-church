import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login page (will create later)
  redirect("/login");
}
