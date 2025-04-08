'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFormStore } from '@/stores/formStore';
import { useCallback } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Schema for Step 6
const FormSchema = z.object({
  activity_level: z.enum(['not_active', 'moderately_active', 'very_active'], {
    required_error: "Please select your activity level."
  }),
});

type FormData = z.infer<typeof FormSchema>;

const activityOptions = [
  { value: 'not_active', label: 'Not Active (Sedentary lifestyle)' },
  { value: 'moderately_active', label: 'Moderately Active (Exercise 1-3 times/week)' },
  { value: 'very_active', label: 'Very Active (Exercise 4+ times/week)' },
];

export default function Step6Activity() {
  // Get data and update function from the store
  const formData = useFormStore(useCallback((state) => state.formData, []));
  const updateFormData = useFormStore(useCallback((state) => state.updateFormData, []));
  const nextStep = useFormStore(useCallback((state) => state.nextStep, []));

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      activity_level: formData.activity_level || undefined,
    },
  });

  const onSubmit = (data: FormData) => {
    updateFormData({ activity_level: data.activity_level });
    nextStep();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="activity_level"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-lg font-semibold">How physically active are you?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      updateFormData({ activity_level: value as 'not_active' | 'moderately_active' | 'very_active' });
                    }}
                    value={field.value}
                    className="flex flex-col space-y-3"
                  >
                    {activityOptions.map((option) => (
                      <Label 
                        key={option.value}
                        htmlFor={`activity-${option.value}`}
                        className="flex items-center space-x-3 p-4 border rounded-md cursor-pointer hover:bg-accent transition-colors has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
                      >
                        <RadioGroupItem value={option.value} id={`activity-${option.value}`} />
                        <span className="font-normal">{option.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">Continue</Button>
      </form>
    </Form>
  );
} 