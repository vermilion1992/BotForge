import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import Link from "next/link";

import ResetPassword from "@/components/Auth/ResetPassword";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password Page",
};

type PageProps = { params: Promise<{ token: string }> };

export default async function ResetPasswordPage(props: PageProps) {
  const params = await props.params;

  if (!params.token) {
    return <div>Invalid token</div>;
  }

  const token = params.token;

  return (
    <>
      <Breadcrumb pageName="Reset Password" />

      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-wrap items-center">
          <div className="w-full xl:w-1/2">
            <div className="w-full p-4 sm:p-12.5 xl:p-15">
              <ResetPassword token={token} />
            </div>
          </div>

          <div className="hidden w-full p-7.5 xl:block xl:w-1/2">
            <div className="custom-gradient-1 overflow-hidden rounded-2xl px-12.5 pt-12.5 dark:!bg-dark-2 dark:bg-none">
              <Link className="mb-10 inline-block" href="/">
                <Image
                  className="hidden dark:block"
                  src={"/images/logo/logo.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                />
                <Image
                  className="dark:hidden"
                  src={"/images/logo/logo-dark.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                />
              </Link>
              <p className="mb-3 text-xl font-medium text-dark dark:text-white">
                Forget your password?
              </p>

              <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
                Reset Password!
              </h1>

              <p className="w-full max-w-[375px] font-medium text-dark-4 dark:text-dark-6">
                Enter your email address to receive a password reset link.
              </p>

              <div className="mt-31">
                <Image
                  src={"/images/grids/grid-02.svg"}
                  alt="Logo"
                  width={405}
                  height={325}
                  className="mx-auto dark:opacity-30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
