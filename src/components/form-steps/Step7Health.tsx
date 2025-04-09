'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { useState, useCallback, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon } from 'lucide-react';
import { toast } from "react-hot-toast";

const healthOptions = [
    { id: 'none', label: 'None of the above' },
    { id: 'diabetes', label: 'Diabetes (any stage)' },
    { id: 'kidney_disease', label: 'Kidney disease or issues' },
    { id: 'liver_disease', label: 'Liver disease or issues' },
    { id: 'pancreas_disease', label: 'Pancreas disease or issues' },
    { id: 'recovering_surgery', label: 'I am recovering from surgery' },
    { id: 'mental_health', label: 'Mental health issues' },
    { id: 'cancer', label: 'Cancer' },
    { id: 'heart_disease_stroke', label: 'Heart disease or stroke' },
    { id: 'high_blood_pressure', label: 'High blood pressure' },
    { id: 'thyroid_issues', label: 'Thyroid issues' },
    { id: 'high_cholesterol', label: 'High cholesterol' },
    { id: 'other', label: 'Other (Specify)' },
];

// Schema for Step 7
const FormSchema = z.object({
  health_conditions: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one option.",
  }),
  other_health_description: z.string().optional(),
}).refine((data) => {
  if (data.health_conditions.includes('other')) {
    return data.other_health_description && data.other_health_description.trim().length > 0;
  }
  return true;
}, {
  message: "Please specify the 'other' health condition.",
  path: ["other_health_description"],
});

type FormData = z.infer<typeof FormSchema>;

type Step7HealthProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step7Health({ setSubmitHandler, isSubmitting }: Step7HealthProps) {
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      health_conditions: formData.health_conditions || [],
      other_health_description: formData.other_health_description || '',
    },
    mode: 'onChange',
  });

  const healthConditionsValue = form.watch('health_conditions');

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
        form.setValue('other_health_description', '');
      } else {
        newValues = newValues.filter(val => val !== 'none');
         if (!newValues.includes(optionId)) {
          newValues.push(optionId);
        }
      }
    } else {
      newValues = newValues.filter((value) => value !== optionId);
       if (optionId === 'other') {
          form.setValue('other_health_description', '');
      }
    }
    fieldOnChange(newValues);
    updateFormData({ health_conditions: newValues });
  };

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
       if (name === 'other_health_description') {
           updateFormData({ other_health_description: value.other_health_description });
       }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, updateFormData]);

  const handleValidSubmit = (data: FormData) => {
    updateFormData(data);
    nextStep();
  };

  useEffect(() => {
    setSubmitHandler(async () => {
      const isValid = await form.trigger();
      if (isValid) {
        await form.handleSubmit(handleValidSubmit)();
        return true;
      } else {
         const errors = form.formState.errors;
        let errorMessage = "Please correct the errors.";
        if (errors.other_health_description?.message) {
          errorMessage = errors.other_health_description.message;
        } else if (errors.health_conditions?.message) {
          errorMessage = errors.health_conditions.message;
        }
        toast.error(errorMessage);
        return false;
      }
    });
  }, [setSubmitHandler, form, handleValidSubmit]);

  return (
    <Form {...form}>
      <form id="health-form" className="space-y-4">
        <FormField
          control={form.control}
          name="health_conditions"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">Does any of the following apply for you?</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {healthOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`health-${option.id}`}
                    className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/10'}`}
                  >
                    <FormControl>
                      <Checkbox
                        id={`health-${option.id}`}
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

        {healthConditionsValue?.includes('other') && (
          <FormField
            control={form.control}
            name="other_health_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="other_health_description">Specify other health condition:</FormLabel>
                <FormControl>
                  <Input 
                    id="other_health_description"
                    placeholder="e.g., Allergies, Past injuries" 
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