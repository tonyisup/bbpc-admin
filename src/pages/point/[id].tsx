import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";

export default function Point() {
  const { query } = useRouter();
  const id = query.id as string;


  return <div>Point {id}</div>;
}