'use client';
import React, { useState } from 'react';
import * as Yup from 'yup';
import YupPassword from 'yup-password';
import { useFormik } from 'formik';
import { axiosInstance } from '@/libs/axios.config';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { AxiosError } from 'axios';
import Spinner from 'react-bootstrap/Spinner';
import supabase from '@/libs/supabase';
import { login } from '@/libs/redux/slices/user.slice';
import { useAppDispatch } from '@/app/hooks';
import { setCookie } from 'cookies-next';

const SignupUserForm = () => {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  YupPassword(Yup);

  const initialValues = {
    email: '',
  };

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      email: Yup.string()
        .required('Email is required')
        .email('Please enter a valid email address'),
    }),
    onSubmit: async (values, formikHelpers) => {
      setIsSubmitting(true);
      try {
        await axiosInstance().post('/api/users/v1', values);

        router.push(`/auth/verification?email=${values.email}`);
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(
            error.response?.data.message ||
              'An error occurred while signing up.',
          );
        } else {
          toast.error('An unexpected error occurred.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const isSubmitDisabled =
    !isChecked || !formik.values.email || !!formik.errors.email;

  const handleGoogleSignIn = async (dispatch: any) => {
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

          if (email && id && full_name) {
            const [first_name, ...rest] = full_name.split(' ');
            const last_name = rest.join(' ') || 'Last';

            if (first_name && last_name) {
              try {
                await axiosInstance().post('/api/users/v4', {
                  email,
                  social_id: id,
                  first_name,
                  last_name,
                  role: 'user',
                });

                setCookie('access_token', session.access_token ?? '');

                setCookie('refresh_token', session.refresh_token ?? '');

                dispatch(
                  login({
                    email,
                    id,
                    first_name,
                    last_name,
                    password: '', // Provide default value if necessary
                    social_id: id, // Use social_id from session user
                    role: 'user',
                    image: '', // Provide default value if necessary
                    isVerified: '', // Provide default value if necessary
                  }),
                );
              } catch (error) {
                console.error('Error logging in with Google:', error);
              }
            } else {
              console.error('Error parsing full name:', full_name);
            }
          } else {
            console.error('Missing required user information');
          }
        }
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const dispatch = useAppDispatch();

  const handleGoogleSignInClick = () => {
    handleGoogleSignIn(dispatch);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      {/* Desktop View */}
      <div className="hidden lg:flex w-screen h-screen">
        <div className="flex flex-row items-center justify-between w-full">
          {/* FORM LOGIN */}
          <div className="flex flex-col items-center justify-center w-3/5">
            {/* HEADER SECTION */}
            <div className=" mb-3 flex items-center justify-center flex-col">
              <Link href="/">
                <img
                  src="https://i.ibb.co.com/QPvYKBk/1.png"
                  alt=""
                  className="w-24 "
                />
              </Link>
              <h2 className="font-bold">Create your account</h2>
              <div className="text-zinc-400">
                Let&apos;s get started with Atcasa
              </div>
            </div>

            {/* login google */}
            <div>
              <button
                className="btn btn-outline-dark w-full "
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
                    className="form-control mb-3"
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

                {/* // TERMS AND CONDITION */}
                <div className="flex flex-row gap-2 items-center">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={isChecked}
                    onChange={() => setIsChecked(!isChecked)}
                  />
                  <div className="text-xs">
                    I agree to
                    <span className="font-semibold text-[#263C94] cursor-pointer">
                      {' '}
                      Terms & Privacy Policy
                    </span>
                  </div>
                </div>
                <button
                  className="btn bsb-btn-xl btn-dark w-full my-3"
                  type="submit"
                  disabled={isSubmitDisabled || isSubmitting}
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
                    'Sign up'
                  )}
                </button>
              </form>

              <div className="text-xs flex flex-row gap-1">
                <div>Already have an account?</div>
                <Link
                  href="/auth/login/user"
                  className="font-semibold text-[#263C94] no-underline"
                >
                  Sign in here
                </Link>
              </div>
            </div>
          </div>

          {/* BANNER */}
          <div className="h-full w-2/5 mx-8 lg:flex justify-center sm:hidden md:hidden">
            <img
              src="https://i.ibb.co.com/GsGmwmP/photo-1526057565006-20beab8dd2ed-1-1.png"
              alt=""
              className="h-screen object-cover lg:flex sm:hidden md:hidden"
            />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden flex flex-col items-center justify-center w-full">
        {/* HEADER SECTION */}
        <div className=" mb-3 flex items-center justify-center flex-col">
          <Link href="/">
            <img
              src="https://i.ibb.co.com/QPvYKBk/1.png"
              alt=""
              className="w-24 "
            />
          </Link>
          <h2 className="font-bold">Create your account</h2>
          <div className="text-zinc-400">
            Let&apos;s get started with Atcasa
          </div>
        </div>

        {/* login google */}
        <div>
          <button
            className="btn btn-outline-dark w-full "
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
                className="form-control mb-3"
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

            {/* TERMS AND CONDITIONS */}
            <div className="flex flex-row gap-2 items-center">
              <input
                type="checkbox"
                className="checkbox"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
              />
              <div className="text-xs">
                I agree to
                <span className="font-semibold text-[#263C94] cursor-pointer">
                  {' '}
                  Terms & Privacy Policy
                </span>
              </div>
            </div>
            {/* DISABLE SUBMIT IF TERMS NOT AGREED */}
            <button
              className="btn bsb-btn-xl btn-dark w-full my-3"
              type="submit"
              disabled={isSubmitDisabled || isSubmitting}
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
                'Sign up'
              )}
            </button>
          </form>

          {/* SIGN IN LINK */}
          <div className="text-xs flex flex-row gap-1">
            <div>Already have an account?</div>
            <Link
              href="/auth/login/user"
              className="font-semibold text-[#263C94] no-underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupUserForm;
