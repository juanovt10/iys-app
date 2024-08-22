import { remarksSchema } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form } from './ui/form';
import CustomTextarea from './CustomTextarea';
import { Button } from './ui/button';

const RemarksForm = ({ nextStep, prevStep, updateFormData, remarksData }: any) => {
  const defaultValues = {
    validez: "Validez de la oferta 15 dias.",
    anticipo: "Anticipo 60% que debe ser girado 12 dias antes del inicio de la obra.",
    pagos: "Saldo 40% a corte final de ejecucion.",
    premarcado: "Condiciones de premarcado y superficie a definir en visita de obra.",
    tiempos: "Tiempo de ejecucion por definir segun horarios disponibles para la aplicacion y condiciones climaticas.",
    cambios: "Cualquier cambio en las cantidades de obra modificara el valor total de esta cotizacion pero se mantendran los valores unitarios para la liquidacion final",
    AIU: "A.I.U. compuesto 10% Administracion 5% Imprevistos y 5% Utilidad",
  }

  console.log('remakrs data', remarksData)

  const form = useForm<z.infer<typeof remarksSchema>>({
    resolver: zodResolver(remarksSchema),
    defaultValues: Object.keys(remarksData).length > 0 ? remarksData : defaultValues,
  });

  const onSubmit = (data: z.infer<typeof remarksSchema>) => {
    updateFormData({ remarks: data });
    nextStep();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="space-y-4 max-h-full overflow-y-auto px-1 pb-1">
          <CustomTextarea
            control={form.control}
            name="validez"
            label="Validez"
            placeholder="Entre validez de la oferta"
          />
          <CustomTextarea
            control={form.control}
            name="anticipo"
            label="Anticipo"
            placeholder="Entre terminos de anticipo"
          />
          <CustomTextarea
            control={form.control}
            name="pagos"
            label="Pagos"
            placeholder="Entre terminos de pago"
          />
          <CustomTextarea
            control={form.control}
            name="premarcado"
            label="Premarcado"
            placeholder="Entre condiciones de premarcado"
          />
          <CustomTextarea
            control={form.control}
            name="tiempos"
            label="Tiempos"
            placeholder="Entre tiempos de ejecucion"
          />
          <CustomTextarea
            control={form.control}
            name="cambios"
            label="Cambios"
            placeholder="Entre obsevaciones de cambios"
          />
          <CustomTextarea
            control={form.control}
            name="AIU"
            label="AIU"
            placeholder="Entre observaciones de AIU"
          />
        </div>

        <div className="flex justify-between pt-5 border-t mt-5">
          <Button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Atras
          </Button>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </Form>
  );
}

export default RemarksForm;
