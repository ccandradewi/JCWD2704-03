'use client';

import { useAppSelector } from '@/app/hooks';
import { axiosInstance } from '@/libs/axios.config';
import { User } from '@/models/user.model';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ResendEmail() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { email } = useAppSelector((state) => state.auth) as User;

  let userEmail: string | undefined = email || undefined;
  if (!userEmail) {
    const emailParam: string | null = searchParams.get('email');
    if (emailParam) {
      userEmail = emailParam;
    }
  }

  const resendVerif = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance().post(
        '/api/users/resendVerificationEmail',
        { email: userEmail },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const { message } = response.data;
      console.log(response.data);

      if (message === 'You have previously verified your email') {
        toast.error(message);
      } else {
        toast.success(
          message ||
            'Verification e-mail has been sent. Please check your inbox!',
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center tracking-tighter overflow-hidden py-6 sm:py-12 bg-white">
      <div className="max-w-xl px-3 text-center flex flex-col items-center">
        <a className="py-4">
          <img
            src="https://i.ibb.co.com/ScGJckR/ATCASA.png"
            alt="atcasa logo"
            className="lg:w-40 w-24"
          />
        </a>
        <h2 className="pb-4 lg:text-[42px] font-bold text-zinc-800">
          Thank you for signing up!
        </h2>
        <h2 className="lg:text-xl text-base font-semibold text-zinc-800">
          Please check your e-mail and verify your account{' '}
          <span className="lg:hidden">
            to continue browsing properties in Atcasa.
          </span>
        </h2>
        <h2 className="lg:text-xl text-base font-semibold text-zinc-800 hidden lg:flex md:flex">
          to continue browsing properties in Atcasa.
        </h2>

        <p className="text-base lg:text-lg font-medium text-zinc-500 py-4">
          {"Didn't get e-mail? "}
        </p>
        <button
          onClick={resendVerif}
          className="btn btn-dark w-60"
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner
              animation="border"
              role="status"
              size="sm"
              className="me-2"
            ></Spinner>
          ) : (
            'Resend e-mail'
          )}
        </button>
      </div>
    </div>
  );
}
