'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/hooks';
import { axiosInstance } from '@/libs/axios.config';
import { AxiosError } from 'axios';
import * as Yup from 'yup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setCookie, getCookie } from 'cookies-next';
import { User } from '@/models/user.model';
import { jwtDecode } from 'jwt-decode';
import { login } from '@/libs/redux/slices/user.slice';
import { CustomJwtPayload } from '@/models/user.model';
import { updateProfile, keepLogin } from '@/libs/redux/slices/user.slice';
import { imageSrcUser } from '@/utils/imagerender';
import { Spinner } from 'react-bootstrap';

function EditProfileForm() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();

  const imageRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const refreshed = searchParams.get('refreshed');
    if (refreshed === 'true') {
      // Reload the page
      window.location.reload();

      // Update the URL to remove 'refreshed=true'
      const url = new URL(window.location.href);
      url.searchParams.delete('refreshed');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const initialValues = {
    image: null as string | File | null,
    first_name: '',
    last_name: '',
    email: '',
  };

  const validationSchema = Yup.object().shape({
    image: Yup.mixed().nullable(),
    first_name: Yup.string()
      .required('First name is required')
      .min(3, 'First name must have at least 3 characters'),
    last_name: Yup.string()
      .required('Last name is required')
      .min(3, 'Last name must have at least 3 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('first_name', values.first_name);
        formData.append('last_name', values.last_name);
        formData.append('email', values.email);

        if (values.image) {
          formData.append('image', values.image);
        }

        const response = await axiosInstance().patch(
          '/api/users/edit',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true,
          },
        );

        const { token, user: fetchedUser } = response.data;
        setCookie('access_token', token);

        dispatch(login(fetchedUser));
        window.location.reload();
      } catch (error) {
        if (error instanceof AxiosError) {
          alert(error.response?.data.message);
        }
      } finally {
        setLoading(false);
      }
    },
  });

  const handleSubmit = (values: any) => {
    dispatch(updateProfile(values));
  };

  useEffect(() => {
    if (user && user.id) {
      const imgSrc = user.image_name
        ? `${imageSrcUser}${user.image_name}`
        : null;

      formik.setValues({
        image: imgSrc,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });

      setImagePreview(imgSrc);
    }
  }, [user]);

  useEffect(() => {
    // Log the user object to check the value
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      formik.setFieldValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };

      reader.readAsDataURL(file);

      if (file.size > 1048576) {
        toast.error('File size exceeds 1MB. Please select a smaller file.', {
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } else {
      formik.setFieldValue('image', null);
      setImagePreview(null);
    }
  };

  return (
    <div className="tracking-tighter max-w-xl">
      {/* HEADER */}
      <div className=" ">
        <div className="py-4">
          <img
            src="https://i.ibb.co.com/brDL8tH/3.png"
            alt=""
            className="w-10"
          />
        </div>

        <div className="font-semibold text-2xl mb-2">Your profile</div>

        <div className="text-zinc-500 mb-2">
          The information you share will be used across Atcasa to help other
          guests and Hosts get to know you!
        </div>
      </div>

      <div className="flex justify-center items-center">
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-2 w-full"
        >
          <div className="form-group">
            <div className="label">
              <span className="label-text font-semibold">Profile Picture</span>
            </div>

            <div className="flex flex-row gap-4 items-center">
              {imagePreview ? (
                <div className="w-28 h-28 object-cover">
                  <img
                    src={imagePreview}
                    alt="Profile Picture"
                    className="w-28 h-28 object-cover rounded-full border-zinc-400 border-2 bg-zinc-300"
                  />
                </div>
              ) : (
                <div className="w-28 h-28 object-cover rounded-full border-zinc-400 border-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    role="presentation"
                    focusable="false"
                    className="w-full h-full"
                  >
                    <path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.51 6.51 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4A12.67 12.67 0 0 1 16 28.7z"></path>
                  </svg>
                </div>
              )}

              <div className="image-preview-container mt-2">
                <input
                  id="image"
                  name="image"
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                  ref={imageRef}
                />
                {formik.touched.image && formik.errors.image ? (
                  <div className="text-danger text-xs mt-2">
                    {formik.errors.image}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="form-group w-full">
            <div className="label">
              <span className="label-text font-semibold">First Name</span>
            </div>
            <input
              type="text"
              placeholder="Type here"
              id="first_name"
              name="first_name"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.first_name}
              className="form-control input input-bordered w-full"
            />
            {formik.touched.first_name && formik.errors.first_name ? (
              <div className="text-danger text-xs mt-2">
                {formik.errors.first_name}
              </div>
            ) : null}
          </div>
          <div className="form-group w-full">
            <div className="label">
              <span className="label-text font-semibold">Last Name</span>
            </div>
            <input
              type="text"
              placeholder="Type here"
              id="last_name"
              name="last_name"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.last_name}
              className="form-control input input-bordered w-full"
            />
            {formik.touched.last_name && formik.errors.last_name ? (
              <div className="text-danger text-xs mt-2">
                {formik.errors.last_name}
              </div>
            ) : null}
          </div>

          {/* EMAIL */}
          <div className="form-group w-full">
            <div className="label">
              <span className="label-text font-semibold">Email Address</span>
            </div>
            <div className="label text-sm  text-zinc-400">
              Changing your e-mail address will require you to verify your
              e-mail address.
            </div>

            <input
              type="text"
              placeholder="Type here"
              id="email"
              name="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              className="file-input file-input-bordered w-full"
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="text-danger text-xs mt-2">
                {formik.errors.email}
              </div>
            ) : null}
            <div>
              {' '}
              {user?.isRequestingEmailChange && (
                <div className="label font-semibold text-sm text-red-500">
                  Please verify your e-mail!
                </div>
              )}
            </div>
          </div>

          <div className="form-group mt-4">
            <button
              type="submit"
              className="btn btn-dark bg-neutral w-full mb-5 text-zinc-50 flex justify-center items-center"
            >
              {loading ? (
                <Spinner animation="border" size="sm" /> // Display spinner when loading
              ) : (
                'Update my profile'
              )}
            </button>
          </div>
          <ToastContainer />
        </form>
      </div>
    </div>
  );
}

export default EditProfileForm;
