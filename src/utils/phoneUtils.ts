// Função para aplicar máscara de telefone brasileiro
export const formatPhoneNumber = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const digitsOnly = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedDigits = digitsOnly.slice(0, 11);
  
  // Aplica a máscara baseada no número de dígitos
  if (limitedDigits.length <= 2) {
    return limitedDigits;
  } else if (limitedDigits.length <= 3) {
    return `(${limitedDigits.slice(0, 2)})${limitedDigits.slice(2)}`;
  } else if (limitedDigits.length <= 7) {
    return `(${limitedDigits.slice(0, 2)})${limitedDigits.slice(2, 3)} ${limitedDigits.slice(3)}`;
  } else if (limitedDigits.length <= 11) {
    // Para números com 11 dígitos (celular)
    if (limitedDigits.length === 11) {
      return `(${limitedDigits.slice(0, 2)})${limitedDigits.slice(2, 3)} ${limitedDigits.slice(3, 7)}-${limitedDigits.slice(7)}`;
    }
    // Para números com 10 dígitos (fixo)
    return `(${limitedDigits.slice(0, 2)})${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
  }
  
  return limitedDigits;
};

// Função para remover a máscara e obter apenas os dígitos
export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};