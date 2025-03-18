import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqnuvxpxjtkddhhpaoxv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbnV2eHB4anRrZGRoaHBhb3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ2NjA2MiwiZXhwIjoyMDQ3MDQyMDYyfQ.Pyz5SMNXy0Wz7tPZJDa9nOHHADS_kixQJVYhZraneHI'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const formatDocument = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '')
  
  // Verifica se é CPF ou CNPJ baseado no tamanho
  if (numbers.length <= 11) {
    // Formata como CPF: 999.999.999-99
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
  } else {
    // Formata como CNPJ: 99.999.999/0001-99
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5')
  }
}

export const unformatDocument = (value: string) => {
  return value.replace(/\D/g, '')
}
