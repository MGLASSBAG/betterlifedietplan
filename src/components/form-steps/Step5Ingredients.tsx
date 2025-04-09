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

const ingredientOptions = [
  { id: 'none', label: 'None, I like all ingredients' },
  { id: 'mushrooms', label: 'Mushrooms' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'nuts', label: 'Nuts' },
  { id: 'seeds', label: 'Seeds' },
  { id: 'avocado', label: 'Avocado' },
  { id: 'olives', label: 'Olives' },
  { id: 'bell_peppers', label: 'Bell Peppers' },
  { id: 'broccoli', label: 'Broccoli' },
  { id: 'cauliflower', label: 'Cauliflower' },
  { id: 'cabbage', label: 'Cabbage' },
  { id: 'green_beans', label: 'Green Beans' },
  { id: 'tomatoes', label: 'Tomatoes' },
  { id: 'onions', label: 'Onions' },
  { id: 'garlic', label: 'Garlic' },
  { id: 'herbs', label: 'Herbs (e.g., cilantro, parsley)' },
  { id: 'spices', label: 'Spicy food' },
  { id: 'cheese', label: 'Cheese' },
  { id: 'dairy', label: 'Other dairy (e.g., cream, yogurt)' },
  { id: 'other', label: 'Other (Specify)' },
];

// Schema for Step 5
const FormSchema = z.object({
  disliked_ingredients: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one option.",
  }),
  other_ingredient_description: z.string().optional(),
}).refine((data) => {
  if (data.disliked_ingredients.includes('other')) {
    return data.other_ingredient_description && data.other_ingredient_description.trim().length > 0;
  }
  return true;
}, {
  message: "Please specify the 'other' ingredient you dislike.",
  path: ["other_ingredient_description"],
});

type FormData = z.infer<typeof FormSchema>;

type Step5IngredientsProps = {
  setSubmitHandler: (handler: () => Promise<boolean>) => void;
  isSubmitting: boolean;
};

export default function Step5Ingredients({ setSubmitHandler, isSubmitting }: Step5IngredientsProps) {
  const formData = useFormStore((state) => state.formData);
  const updateFormData = useFormStore((state) => state.updateFormData);
  const nextStep = useFormStore((state) => state.nextStep);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      disliked_ingredients: formData.disliked_ingredients || [],
      other_ingredient_description: formData.other_ingredient_description || '',
    },
    mode: 'onChange',
  });

  const dislikedIngredientsValue = form.watch('disliked_ingredients');

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
        form.setValue('other_ingredient_description', '');
      } else {
        newValues = newValues.filter(val => val !== 'none');
        if (!newValues.includes(optionId)) {
          newValues.push(optionId);
        }
      }
    } else {
      newValues = newValues.filter((value) => value !== optionId);
      if (optionId === 'other') {
          form.setValue('other_ingredient_description', '');
      }
    }
    fieldOnChange(newValues);
    updateFormData({ disliked_ingredients: newValues });
  };

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
       if (name === 'other_ingredient_description') {
           updateFormData({ other_ingredient_description: value.other_ingredient_description });
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
        if (errors.other_ingredient_description?.message) {
          errorMessage = errors.other_ingredient_description.message;
        } else if (errors.disliked_ingredients?.message) {
          errorMessage = errors.disliked_ingredients.message;
        }
        toast.error(errorMessage);
        return false;
      }
    });
  }, [setSubmitHandler, form, handleValidSubmit]);

  return (
    <Form {...form}>
      <form id="ingredients-form" className="space-y-4">
        <FormField
          control={form.control}
          name="disliked_ingredients"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-lg font-semibold">Which ingredients you DON'T LIKE?</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ingredientOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`ingredient-${option.id}`}
                    className={`flex items-center space-x-3 p-4 border rounded-md transition-colors ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-primary/10'}`}
                  >
                    <FormControl>
                      <Checkbox
                        id={`ingredient-${option.id}`}
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

        {dislikedIngredientsValue?.includes('other') && (
          <FormField
            control={form.control}
            name="other_ingredient_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="other_ingredient_description">Specify other disliked ingredient:</FormLabel>
                <FormControl>
                  <Input
                    id="other_ingredient_description"
                    placeholder="e.g., Asparagus, Specific spice" 
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