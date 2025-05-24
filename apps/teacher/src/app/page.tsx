'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { loginSchema, loginInitialValues } from '@intellect-kanban/utils';
import { login } from '../server/auth-actions';
import { Button } from '@intellect-kanban/ui';
import { EyeIcon, EyeOffIcon, ClipboardList, Users, PanelTop, GanttChartSquare, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the server action for login with redirect to teacher dashboard
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
    hidden: { scale: 0, rotate: -10 },
    visible: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 150, delay: 0.3 } }
  };

  const kanbanColumns = [
    { title: "Plan", color: "bg-yellow-100", icon: <ClipboardList size={14} className="text-yellow-700" /> },
    { title: "Assign", color: "bg-blue-100", icon: <Users size={14} className="text-blue-700" /> },
    { title: "Track", color: "bg-green-100", icon: <GanttChartSquare size={14} className="text-green-700" /> }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="absolute top-10 left-10 hidden lg:block"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <GanttChartSquare size={40} className="text-primary" />
      </motion.div>
      
      <motion.div 
        className="absolute top-10 right-10 hidden lg:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Users size={40} className="text-primary" />
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
          <PanelTop size={50} className="text-primary" />
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
              Teacher Portal
            </motion.h1>
            <motion.p 
              className="mt-2 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              Sign in to manage your classes and organize student activities.
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
          className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3"
          variants={itemVariants}
        >
          <motion.div 
            className="bg-card text-card-foreground p-4 rounded-lg shadow-md flex items-center border border-border"
            whileHover={{ y: -5 }}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              <ClipboardList size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Create Classes</h3>
              <p className="text-xs text-muted-foreground">Organize your teaching activities</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-card text-card-foreground p-4 rounded-lg shadow-md flex items-center border border-border"
            whileHover={{ y: -5 }}
          >
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center mr-3">
              <GanttChartSquare size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Build Kanban Boards</h3>
              <p className="text-xs text-muted-foreground">Visualize student progress</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-card text-card-foreground p-4 rounded-lg shadow-md flex items-center border border-border"
            whileHover={{ y: -5 }}
          >
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mr-3">
              <Users size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Track Students</h3>
              <p className="text-xs text-muted-foreground">Monitor learning progress</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
