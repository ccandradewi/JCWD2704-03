'use client';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import { userLogin } from '@/libs/redux/middlewares/auth.middleware';
import { toast } from 'react-toastify';
import { UserLoginPayload } from '@/models/user.model';
import Link from 'next/link';
import { AxiosError } from 'axios';
import Spinner from 'react-bootstrap/Spinner';
import supabase from '@/libs/supabase';
import { login } from '@/libs/redux/slices/user.slice';
import { useAppDispatch } from '@/app/hooks';
import { setCookie } from 'cookies-next';
import { axiosInstance } from '@/libs/axios.config';

const LoginForm: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    email: '',
    password: '',
  };

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const result = await dispatch(
          userLogin({
            email: values.email,
            password: values.password,
          } as UserLoginPayload),
        );
        formik.resetForm();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(
            error.response?.data.message ||
              'An error occurred while signing in.',
          );
        } else {
          toast.error('An unexpected error occurred.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${'http://localhost:3000'}/auth/callback?userType=user`,
        },
      });

      if (error) {
        return;
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user = session.user;
          const { email, id } = user;
          const { full_name } = user.user_metadata;

          if (!email) {
            console.error('Email is undefined');
            return;
          }

          const [first_name, last_name] = full_name
            ? full_name.split(' ')
            : ['', ''];

          try {
            await axiosInstance().post('/api/users/v4', {
              email,
              social_id: id,
              first_name,
              last_name,
              role: 'user',
            });

            setCookie('access_token', session.access_token);
            setCookie('refresh_token', session.refresh_token);

            dispatch(
              login({
                email,
                id,
                first_name,
                last_name,
                role: 'user',
                isVerified: 'true',
              }),
            );
          } catch (error) {
            console.error('Error logging in with Google:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      {/* Desktop View */}
      <div className="hidden lg:flex w-screen h-screen">
        <div className="flex flex-row items-center justify-between w-full">
          {/* BANNER */}
          <div className="h-full w-2/5 mx-8 lg:flex justify-center sm:hidden md:hidden">
            <img
              src="https://i.ibb.co.com/rtS8j9q/photo-1526057565006-20beab8dd2ed-1-1-2.png"
              alt=""
              className="h-screen object-cover lg:flex sm:hidden md:hidden"
            />
          </div>

          {/* FORM LOGIN */}
          <div className="flex flex-col items-center justify-center w-3/5">
            {/* HEADER SECTION */}
            <div className="mb-3 flex items-center justify-center flex-col">
              <Link href="/">
                <img
                  src="https://i.ibb.co.com/QPvYKBk/1.png"
                  alt=""
                  className="w-24"
                />
              </Link>
              <h2 className="font-bold">Welcome back</h2>
              <div className="text-zinc-400">
                Sign in to continue browsing properties in Atcasa
              </div>
            </div>

            {/* login google */}
            <div>
              <button
                className="btn btn-outline-dark w-full"
                type="button"
                onClick={handleGoogleSignIn}
              >
                <div className="flex flex-row justify-center items-center gap-1">
                  <div>
                    <img
                      src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                      className="w-8 h-8"
                      alt=""
                    />
                  </div>
                  <div className="font-semibold">Login with Google</div>
                </div>
              </button>

              {/* OR SECTION */}
              <div className="flex flex-row justify-center items-center my-3">
                <div className="text-xs">
                  <span className="text-zinc-400">—————————</span>
                  <span> or </span>
                  <span className="text-zinc-400">—————————</span>
                </div>
              </div>

              {/* FORM SUBMIT EMAIL */}
              <form
                onSubmit={formik.handleSubmit}
                className="flex flex-col w-60 lg:w-[500px] "
              >
                <div className="form-floating w-full">
                  <input
                    type="email"
                    className="form-control mb-2"
                    id="floatingInput"
                    placeholder="name@example.com"
                    {...formik.getFieldProps('email')}
                  />
                  <label htmlFor="floatingInput">Email address</label>
                </div>
                {formik.touched.email && formik.errors.email ? (
                  <div className="text-red-700 text-xs mb-3">
                    {formik.errors.email}
                  </div>
                ) : null}

                <div className="form-floating w-full">
                  <input
                    type="password"
                    className="form-control mb-2"
                    id="floatingPassword"
                    placeholder="•••••••"
                    {...formik.getFieldProps('password')}
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>
                {formik.touched.password && formik.errors.password ? (
                  <div className="text-red-700 text-xs mb-3">
                    {formik.errors.password}
                  </div>
                ) : null}

                <button
                  className="btn bsb-btn-xl btn-dark w-full my-3"
                  type="submit"
                  disabled={!formik.isValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <Spinner
                      animation="border"
                      role="status"
                      size="sm"
                      className="me-2"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <div className="flex justify-between">
                <div className="text-xs flex flex-row gap-1">
                  <div>Don&apos;t have account?</div>
                  <Link
                    href="/auth/signup/user"
                    className="font-semibold text-[#263C94] no-underline"
                  >
                    Register here
                  </Link>
                </div>
                <div className="text-xs flex flex-row gap-1">
                  <Link
                    href="/auth/passwordreset"
                    className="font-semibold text-[#263C94] no-underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden flex flex-col items-center justify-center w-full">
        {/* HEADER SECTION */}
        <div className="mb-3 flex items-center justify-center flex-col">
          <Link href="/">
            <img
              src="https://i.ibb.co.com/QPvYKBk/1.png"
              alt=""
              className="w-24"
            />
          </Link>
          <h2 className="font-bold">Welcome back</h2>
          <div className="text-zinc-400">
            Sign in to continue browsing properties
          </div>
        </div>

        {/* login google */}
        <div>
          <button
            className="btn btn-outline-dark w-full"
            type="button"
            onClick={handleGoogleSignIn}
          >
            <div className="flex flex-row justify-center items-center gap-1">
              <div>
                <img
                  src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
                  className="w-8 h-8"
                  alt=""
                />
              </div>
              <div className="font-semibold">Login with Google</div>
            </div>
          </button>

          {/* OR SECTION */}
          <div className="flex flex-row justify-center items-center my-3">
            <div className="text-xs">
              <span className="text-zinc-400">—————————</span>
              <span> or </span>
              <span className="text-zinc-400">—————————</span>
            </div>
          </div>

          {/* FORM SUBMIT EMAIL */}
          <form
            onSubmit={formik.handleSubmit}
            className="flex flex-col w-60 lg:w-[500px]"
          >
            <div className="form-floating w-full">
              <input
                type="email"
                className="form-control mb-2"
                id="floatingInput"
                placeholder="name@example.com"
                {...formik.getFieldProps('email')}
              />
              <label htmlFor="floatingInput">Email address</label>
            </div>
            {formik.touched.email && formik.errors.email ? (
              <div className="text-red-700 text-xs mb-3">
                {formik.errors.email}
              </div>
            ) : null}

            <div className="form-floating w-full">
              <input
                type="password"
                className="form-control mb-2"
                id="floatingPassword"
                placeholder="•••••••"
                {...formik.getFieldProps('password')}
              />
              <label htmlFor="floatingPassword">Password</label>
            </div>
            {formik.touched.password && formik.errors.password ? (
              <div className="text-red-700 text-xs mb-3">
                {formik.errors.password}
              </div>
            ) : null}

            <button
              className="btn bsb-btn-xl btn-dark w-full my-3"
              type="submit"
              disabled={!formik.isValid || isSubmitting}
            >
              {isSubmitting ? (
                <Spinner
                  animation="border"
                  role="status"
                  size="sm"
                  className="me-2"
                >
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="flex flex-col gap-2 justify-between">
            <div className="text-xs flex flex-row gap-1">
              <div>Don&apos;t have account?</div>
              <Link
                href="/auth/signup/user"
                className="font-semibold text-[#263C94] no-underline"
              >
                Register here
              </Link>
            </div>
            <div className="text-xs flex flex-row gap-1">
              <Link
                href="/auth/passwordreset"
                className="font-semibold text-[#263C94] no-underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
