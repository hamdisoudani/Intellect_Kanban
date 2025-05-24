'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { loginSchema, loginInitialValues } from '@intellect-kanban/utils';
import { login } from '../server/auth-actions';
import { Button } from '@intellect-kanban/ui';
import { EyeIcon, EyeOffIcon, NotebookPen, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the server action for login with redirect to student dashboard
      const result = await login(values.email, values.password, '/dashboard');
      
      // If there's an error, show it (the redirect happens automatically)
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  const iconVariants = {
    hidden: { scale: 0 },
    visible: { scale: 1, transition: { type: "spring", stiffness: 150, delay: 0.3 } }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="absolute top-10 left-10 hidden lg:block"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <GraduationCap size={40} className="text-primary" />
      </motion.div>
      
      <motion.div 
        className="absolute top-10 right-10 hidden lg:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <BookOpen size={40} className="text-primary" />
      </motion.div>

      <motion.div 
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="flex justify-center mb-6"
          variants={iconVariants}
        >
          <NotebookPen size={50} className="text-primary" />
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-card text-card-foreground py-8 px-6 shadow-xl rounded-xl sm:px-10 mb-6 border border-border"
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-2xl font-bold text-foreground"
              variants={itemVariants}
            >
              Student Portal
            </motion.h1>
            <motion.p 
              className="mt-2 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              Sign in to manage your learning activities and track your progress.
            </motion.p>
          </div>

          {error && (
            <motion.div 
              variants={itemVariants}
              className="mb-6 p-3 rounded bg-destructive/10 text-destructive flex items-center gap-2 text-sm"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <Formik
            initialValues={loginInitialValues}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty, isSubmitting: formikSubmitting }) => (
              <Form className="space-y-6">
                <motion.div variants={itemVariants}>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="mt-1">
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="block w-full px-3 py-2 placeholder-muted-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-primary sm:text-sm"
                      placeholder="you@example.com"
                    />
                    <ErrorMessage 
                      name="email" 
                      component="div" 
                      className="mt-1 text-sm text-destructive" 
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="block w-full pr-10 px-3 py-2 placeholder-muted-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-primary sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                    <ErrorMessage 
                      name="password" 
                      component="div" 
                      className="mt-1 text-sm text-destructive" 
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full flex justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    disabled={!(isValid && dirty) || isLoading || formikSubmitting}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : "Sign in"}
                  </Button>
                </motion.div>
              </Form>
            )}
          </Formik>
        </motion.div>

        <motion.p 
          variants={itemVariants}
          className="text-center text-sm text-muted-foreground"
        >
          Don't have an account?{' '}
          <motion.a 
            href="/signup" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign up
          </motion.a>
        </motion.p>
        
        <motion.div 
          className="mt-8 flex justify-center space-x-8"
          variants={itemVariants}
        >
          <motion.div 
            className="text-center"
            whileHover={{ y: -5 }}
          >
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen size={20} className="text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Organize Tasks</p>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ y: -5 }}
          >
            <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center">
              <NotebookPen size={20} className="text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Track Progress</p>
          </motion.div>
          <motion.div 
            className="text-center"
            whileHover={{ y: -5 }}
          >
            <div className="w-12 h-12 mx-auto bg-accent rounded-full flex items-center justify-center">
              <GraduationCap size={20} className="text-primary" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Complete Courses</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}