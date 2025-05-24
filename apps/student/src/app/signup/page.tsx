'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { signupSchema, signupInitialValues } from '@intellect-kanban/utils';
import { Button } from '@intellect-kanban/ui';
import { EyeIcon, EyeOffIcon, NotebookPen, GraduationCap, BookOpen, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: typeof signupInitialValues) => {
    setIsSubmitting(true);
    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Signup values:', values);
      // TODO: Implement actual signup logic with backend
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

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

  const benefits = [
    { title: "Track Progress", description: "Visualize your learning journey", icon: <CheckCircle2 size={16} className="text-primary" /> },
    { title: "Manage Tasks", description: "Organize assignments efficiently", icon: <BookOpen size={16} className="text-primary" /> },
    { title: "Achieve Goals", description: "Complete tasks and earn achievements", icon: <GraduationCap size={16} className="text-primary" /> },
  ];

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
          <div className="text-center mb-6">
            <motion.h1 
              className="text-2xl font-bold text-foreground"
              variants={itemVariants}
            >
              Join Student Portal
            </motion.h1>
            <motion.p 
              className="mt-2 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              Create your account to start organizing your learning journey
            </motion.p>
          </div>

          <Formik
            initialValues={signupInitialValues}
            validationSchema={signupSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty, isSubmitting: formikSubmitting }) => (
              <Form className="space-y-4">
                <motion.div variants={itemVariants}>
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <Field
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      className="block w-full px-3 py-2 placeholder-muted-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-primary sm:text-sm"
                      placeholder="John Doe"
                    />
                    <ErrorMessage 
                      name="fullName" 
                      component="div" 
                      className="mt-1 text-sm text-destructive" 
                    />
                  </div>
                </motion.div>

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
                      autoComplete="new-password"
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
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative mt-1">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="block w-full pr-10 px-3 py-2 placeholder-muted-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-primary sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                    <ErrorMessage 
                      name="confirmPassword" 
                      component="div" 
                      className="mt-1 text-sm text-destructive" 
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full flex justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    disabled={!(isValid && dirty) || isSubmitting || formikSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : "Create Account"}
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
          Already have an account?{' '}
          <motion.a 
            href="/" 
            className="font-medium text-primary hover:text-primary/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign in
          </motion.a>
        </motion.p>
        
        <motion.div 
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3"
          variants={itemVariants}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={benefit.title}
              className="bg-card text-card-foreground p-4 rounded-lg shadow-md border border-border"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (index * 0.1) }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  {benefit.icon}
                </div>
                <h3 className="font-medium text-sm">{benefit.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
} 