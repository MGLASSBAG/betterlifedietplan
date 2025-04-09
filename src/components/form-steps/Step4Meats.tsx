'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { CheckIcon } from 'lucide-react';

const meatOptions = [
  { id: 'none', label: 'None, I like all meats' },
  { id: 'vegetarian', label: 'I am vegetarian' },
  { id: 'beef', label: 'Beef' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'pork', label: 'Pork' },
  { id: 'lamb', label: 'Lamb' },
  { id: 'fish', label: 'Fish' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'other', label: 'Other (Specify)' },
];

// Schema for Step 4
const FormSchema = z.object({
  disliked_meats: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one option.",
  }),
  other_meat_description: z.string().optional(),
}).refine((data) => {
  // If 'other' is selected, description must not be empty
  if (data.disliked_meats.includes('other')) {
    return data.other_meat_description && data.other_meat_description.trim().length > 0;
  }
  return true; // Otherwise, description is not required
}, {
  message: "Please specify the 'other' meat you dislike.",
  path: ["other_meat_description"], // Associate error with the description field
});

type FormData = z.infer<typeof FormSchema>;

type Step4MeatsProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step4Meats({ setSubmitHandler, isSubmitting }: Step4MeatsProps) {
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      disliked_meats: formData.disliked_meats || [],
      other_meat_description: formData.other_meat_description || '',
    },
    mode: 'onChange',
  });

  const dislikedMeatsValue = form.watch('disliked_meats');

  const handleCheckboxChange = (
    checked: boolean | string,
    optionId: string,
    currentValues: string[],
    fieldOnChange: (value: string[]) => void
  ) => {
    let newValues = [...currentValues];

    if (checked) {
      if (optionId === 'none') {
        newValues = ['none'];
        form.setValue('other_meat_description', '');
      } else if (optionId === 'vegetarian') {
        newValues = ['vegetarian'];
        form.setValue('other_meat_description', '');
      } else {
        newValues = newValues.filter(val => val !== 'none' && val !== 'vegetarian');
        if (!newValues.includes(optionId)) {
          newValues.push(optionId);
        }
      }
    } else {
      newValues = newValues.filter((value) => value !== optionId);
      if (optionId === 'other') {
        form.setValue('other_meat_description', '');
      }
    }
    
    fieldOnChange(newValues);
    updateFormData({ disliked_meats: newValues });
  };
  
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
       if (name === 'other_meat_description') {
           updateFormData({ other_meat_description: value.other_meat_description });
       }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, updateFormData]);

  const handleValidSubmit = (data: FormData) => {
    updateFormData(data);
    nextStep();
  }

  useEffect(() => {
    setSubmitHandler(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        await form.handleSubmit(handleValidSubmit)();
        return true;
      } else {
        const errors = form.formState.errors;
        let errorMessage = "Please correct the errors.";
        if (errors.other_meat_description?.message) {
          errorMessage = errors.other_meat_description.message;
        } else if (errors.disliked_meats?.message) {
          errorMessage = errors.disliked_meats.message;
        } 
        toast.error(errorMessage);
        return false;
      }
    });
  }, [setSubmitHandler, form, handleValidSubmit]);

  return (
    <Form {...form}>
      <form id="meat-form" className="space-y-4">
        <FormField
          control={form.control}
          name="disliked_meats"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">Which meats you DON'T LIKE?</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {meatOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`meat-${option.id}`}
                    className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/10'}`}
                  >
                    <FormControl>
                      <Checkbox
                        id={`meat-${option.id}`}
                        checked={field.value?.includes(option.id)}
                        onCheckedChange={(checked) => {
                          handleCheckboxChange(checked, option.id, field.value || [], field.onChange);
                        }}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className={`w-4 h-4 border rounded-sm mr-2 flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSubmitting ? 'border-gray-300' : 'border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary'}`}>
                      {field.value?.includes(option.id) && <CheckIcon className="h-3 w-3" />} 
                    </div>
                    <span className="font-normal flex-1">{option.label}</span>
                  </Label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {dislikedMeatsValue?.includes('other') && (
          <FormField
            control={form.control}
            name="other_meat_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="other_meat_description">Specify other disliked meat:</FormLabel>
                <FormControl>
                  <Input 
                    id="other_meat_description"
                    placeholder="e.g., Venison, Duck" 
                    {...field} 
                    disabled={isSubmitting}
                    className={isSubmitting ? 'bg-gray-100' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
} 