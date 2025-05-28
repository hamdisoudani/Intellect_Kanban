'use client';

import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { signupSchema, signupInitialValues } from '@intellect-kanban/utils';
import { signup } from '../../server/auth-actions';
import { EyeIcon, EyeOffIcon, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (values: typeof signupInitialValues) => {
    setIsLoading(true);
    try {
      const result = await signup(
        values.fullName,
        values.email,
        values.password
      );
      
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.message, {
          description: "Redirecting to login page...",
        });
        // Redirect to login page after short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Particles for the background effect
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 5 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center">
      {/* Dynamic Background Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/10 dark:bg-primary/5"
          style={{
            top: `${particle.y}%`,
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: ["0%", "100%"],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            y: {
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear",
            },
            opacity: {
              duration: particle.duration / 2,
              repeat: Infinity,
              yoyo: true,
              ease: "easeInOut",
            },
            delay: particle.delay,
          }}
        />
      ))}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 w-full max-w-7xl z-10">
        {/* Left Column - Illustration (Desktop only) */}
        <motion.div 
          className="col-span-2 hidden lg:flex flex-col justify-center items-center relative"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative h-full flex flex-col justify-center items-center">
            {/* Decorative circles */}
            <div className="absolute w-64 h-64 rounded-full bg-primary/5 dark:bg-primary/10" />
            <div className="absolute w-40 h-40 rounded-full bg-secondary/10 dark:bg-secondary/20 -translate-x-20 translate-y-10" />
            <div className="absolute w-32 h-32 rounded-full bg-accent/10 dark:bg-accent/20 translate-x-16 -translate-y-16" />
            {/* Central logo */}
            <motion.div 
              className="z-10 bg-card p-6 rounded-full shadow-2xl backdrop-blur-lg border border-border/50"
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <GraduationCap size={80} className="text-primary" />
            </motion.div>
            {/* App name */}
            <h1 className="mt-8 text-4xl font-bold text-foreground">Intellect</h1>
            <div className="flex items-center gap-2">
              <span className="h-px w-12 bg-primary/50"></span>
              <h2 className="text-2xl text-primary font-light">Kanban</h2>
              <span className="h-px w-12 bg-primary/50"></span>
            </div>
            <p className="mt-4 text-muted-foreground text-center max-w-xs">
              An intelligent education management platform for educators and students
            </p>
          </div>
        </motion.div>

        {/* Right Column - Signup Form */}
        <motion.div 
          className="col-span-3 px-6 py-8 sm:px-12 lg:px-16 flex flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Mobile-only logo */}
          <motion.div 
            className="mb-10 flex justify-center lg:hidden"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
          >
            <div className="bg-card p-4 rounded-full shadow-lg border border-border/50">
              <GraduationCap size={40} className="text-primary" />
            </div>
          </motion.div>

          {/* Form container */}
          <motion.div
            className="backdrop-blur-lg bg-card/80 dark:bg-card/90 border border-border/50 rounded-3xl p-8 sm:p-10 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="text-center mb-8">
              <motion.h1 
                className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Create Student Account
              </motion.h1>
              <motion.p 
                className="mt-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                Join the platform to organize your learning journey
              </motion.p>
            </div>

            {/* Signup form */}
            <Formik
              initialValues={signupInitialValues}
              validationSchema={signupSchema}
              onSubmit={handleSubmit}
            >
              {({ isValid, dirty, isSubmitting, touched, errors }) => (
                <Form className="space-y-6">
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    {/* Full Name field */}
                    <div>
                      <label 
                        htmlFor="fullName" 
                        className="block text-sm font-medium text-foreground mb-1.5"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <Field
                          id="fullName"
                          name="fullName"
                          type="text"
                          autoFocus
                          autoComplete="name"
                          aria-label="Full Name"
                          className={`block w-full px-4 py-3 rounded-xl bg-background border ${
                            touched.fullName && errors.fullName 
                              ? 'border-destructive focus:ring-destructive' 
                              : 'border-input focus:border-primary focus:ring-primary/20'
                          } outline-none focus:ring-4 transition-all duration-200`}
                          placeholder="John Doe"
                        />
                      </div>
                      <ErrorMessage 
                        name="fullName" 
                        component="div" 
                        className="mt-1.5 text-sm text-destructive font-medium" 
                      />
                    </div>

                    {/* Email field */}
                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-medium text-foreground mb-1.5"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Field
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          aria-label="Email"
                          className={`block w-full px-4 py-3 rounded-xl bg-background border ${
                            touched.email && errors.email 
                              ? 'border-destructive focus:ring-destructive' 
                              : 'border-input focus:border-primary focus:ring-primary/20'
                          } outline-none focus:ring-4 transition-all duration-200`}
                          placeholder="you@example.com"
                        />
                      </div>
                      <ErrorMessage 
                        name="email" 
                        component="div" 
                        className="mt-1.5 text-sm text-destructive font-medium" 
                      />
                    </div>

                    {/* Password field */}
                    <div>
                      <label 
                        htmlFor="password" 
                        className="block text-sm font-medium text-foreground mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Field
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          aria-label="Password"
                          className={`block w-full px-4 py-3 rounded-xl bg-background border ${
                            touched.password && errors.password 
                              ? 'border-destructive focus:ring-destructive' 
                              : 'border-input focus:border-primary focus:ring-primary/20'
                          } outline-none focus:ring-4 transition-all duration-200 pr-10`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={togglePasswordVisibility}
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOffIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage 
                        name="password" 
                        component="div" 
                        className="mt-1.5 text-sm text-destructive font-medium" 
                      />
                    </div>

                    {/* Confirm Password field */}
                    <div>
                      <label 
                        htmlFor="confirmPassword" 
                        className="block text-sm font-medium text-foreground mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Field
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          aria-label="Confirm Password"
                          className={`block w-full px-4 py-3 rounded-xl bg-background border ${
                            touched.confirmPassword && errors.confirmPassword 
                              ? 'border-destructive focus:ring-destructive' 
                              : 'border-input focus:border-primary focus:ring-primary/20'
                          } outline-none focus:ring-4 transition-all duration-200 pr-10`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={toggleConfirmPasswordVisibility}
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage 
                        name="confirmPassword" 
                        component="div" 
                        className="mt-1.5 text-sm text-destructive font-medium" 
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    <motion.button
                      type="submit"
                      className={`w-full py-6 rounded-xl relative overflow-hidden transition-all duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-background
                        ${!(isValid && dirty) || isLoading || isSubmitting
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'}
                      `}
                      disabled={!(isValid && dirty) || isLoading || isSubmitting}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Creating account</span>
                          </>
                        ) : "Create Account"}
                      </span>
                      {/* Button background animation */}
                      {(isValid && dirty) && !isLoading && !isSubmitting && (
                        <motion.div 
                          className="absolute inset-0 bg-primary/20"
                          initial={{ x: '-100%' }}
                          animate={{ 
                            x: ['100%', '-100%'],
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 4,
                            ease: "linear"
                          }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                </Form>
              )}
            </Formik>

            {/* Login link */}
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href="/" 
                  className="text-primary font-medium hover:underline transition-all"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 