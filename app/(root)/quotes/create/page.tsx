'use client'

import ClientInfoForm from '@/components/ClientInfoForm';
import ItemsForm from '@/components/ItemsForm';
import RemarksForm from '@/components/RemarksForm';
import ReviewForm from '@/components/ReviewForm';
import React, { useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const CreateQuote = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    client: {},
    items: [],
    remakrs: {}
  });

  const nextStep = () => setStep((prevStep) => prevStep + 1);
  const prevStep = () => setStep((prevStep) => prevStep - 1);

  const updateFormData = (newData: any) => {
    setFormData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <ClientInfoForm nextStep={nextStep} updateFormData={updateFormData} />;
      case 2:
        return <ItemsForm nextStep={nextStep} prevStep={prevStep} updateFormData={updateFormData} />;
      case 3:
        return <RemarksForm nextStep={nextStep} prevStep={prevStep} updateFormData={updateFormData} />;
      case 4:
        return <ReviewForm prevStep={prevStep} formData={formData} />;
      default:
        return null;
    }
  };

  const renderBreadcrumb = () => {
    const steps = [
      { href: "#", label: "Datos del cliente" },
      { href: "#", label: "Items" },
      { href: "#", label: "Observaciones" },
      { href: "#", label: "Revisión" }
    ];
  
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {steps.slice(0, step).map((stepItem, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {index === step - 1 ? (
                  <BreadcrumbPage>{stepItem.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href="#" onClick={() => setStep(index + 1)}>
                    {stepItem.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < step - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };
  

  return (
    <div className="flex flex-col gap-4 p-5 w-full">
      <h1 className="text-2xl font-extrabold">Crear Cotización</h1>
      {renderBreadcrumb()}
      {renderStep()}
    </div>
  );
};

export default CreateQuote