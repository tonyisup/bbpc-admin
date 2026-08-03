import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination:
      process.env.NEXT_PUBLIC_BBPC_RECORDING_URL ?? "/?unavailable=%2Frecord",
    permanent: false,
  },
});

export default function RecordPage() {
  return null;
}
