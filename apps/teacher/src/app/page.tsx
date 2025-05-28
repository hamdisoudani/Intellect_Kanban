'use client';

import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { loginSchema, loginInitialValues } from '@intellect-kanban/utils';
import { login } from '../server/auth-actions';
import { EyeIcon, EyeOffIcon, PanelTop } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(values.email, values.password, '/dashboard');
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

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
              <PanelTop size={80} className="text-primary" />
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

        {/* Right Column - Login Form */}
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
              <PanelTop size={40} className="text-primary" />
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
                Teacher Portal
              </motion.h1>
              <motion.p 
                className="mt-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                Sign in to manage your classes and activities
              </motion.p>
            </div>

            {/* Error message */}
            {error && (
              <motion.div 
                className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/20">
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-destructive"
                  >
                    <path 
                      d="M8 5.33333V8M8 10.6667H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            {/* Login form */}
            <Formik
              initialValues={loginInitialValues}
              validationSchema={loginSchema}
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
                          autoFocus
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
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="password" className="text-sm font-medium text-foreground">
                          Password
                        </label>
                        <Link href="#" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Field
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
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
                            <span>Signing in</span>
                          </>
                        ) : "Sign in"}
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

            {/* Sign up link */}
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  href="/signup" 
                  className="text-primary font-medium hover:underline transition-all"
                >
                  Create account
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
