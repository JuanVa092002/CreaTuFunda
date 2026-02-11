import type { Locale } from '@/lib/i18n'
import { ShippingAddress } from '@prisma/client'
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

const EMAIL_COPY = {
  es: {
    preview: 'Resumen de tu pedido y fecha estimada de entrega',
    alt: 'CreaTuFunda',
    heading: '¡Gracias por tu pedido!',
    body1:
      'Estamos preparando todo para el envío y te notificaremos cuando tu paquete haya sido despachado. La entrega normalmente tarda de 2 a 3 días hábiles.',
    body2:
      'Si tienes alguna pregunta sobre tu pedido, contáctanos con tu número de orden y con gusto te ayudaremos.',
    shippingTo: 'Enviar a:',
    orderNumber: 'Número de orden',
    orderDate: 'Fecha de orden',
    contact:
      'Por favor contáctanos si tienes alguna duda. (Si respondes a este correo, no podremos verlo.)',
    copyright: '© CreaTuFunda. Todos los derechos reservados.',
  },
  en: {
    preview: 'Your order summary and estimated delivery date',
    alt: 'CreaTuFunda',
    heading: 'Thank you for your order!',
    body1:
      "We're preparing everything for delivery and will notify you once your package has been shipped. Delivery usually takes 2 to 3 business days.",
    body2:
      "If you have any questions regarding your order, please feel free to contact us with your order number and we're here to help.",
    shippingTo: 'Shipping to:',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    contact:
      "Please contact us if you have any questions. (If you reply to this email, we won't be able to see it.)",
    copyright: '© CreaTuFunda. All Rights Reserved.',
  },
} as const

const OrderReceivedEmail = ({
  shippingAddress,
  orderId,
  orderDate,
  locale = 'es',
}: {
  shippingAddress: ShippingAddress
  orderId: string
  orderDate: string
  locale?: Locale
}) => {
  const copy = EMAIL_COPY[locale === 'en' ? 'en' : 'es']
  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ??
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://creatufunda.vercel.app')

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={message}>
            <Img
              src={`${baseUrl}/snake-3.png`}
              width='65'
              height='73'
              alt={copy.alt}
              style={{ margin: 'auto' }}
            />
            <Heading style={global.heading}>{copy.heading}</Heading>
            <Text style={global.text}>{copy.body1}</Text>
            <Text style={{ ...global.text, marginTop: 24 }}>{copy.body2}</Text>
          </Section>
          <Hr style={global.hr} />
          <Section style={global.defaultPadding}>
            <Text style={adressTitle}>
              {copy.shippingTo} {shippingAddress.name}
            </Text>
            <Text style={{ ...global.text, fontSize: 14 }}>
              {shippingAddress.street}, {shippingAddress.city},{' '}
              {shippingAddress.state} {shippingAddress.postalCode}
            </Text>
          </Section>
          <Hr style={global.hr} />
          <Section style={global.defaultPadding}>
            <Row style={{ width: '100%' }}>
              <Column
                style={{
                  width: '60%',
                  paddingRight: '24px',
                  verticalAlign: 'top',
                }}>
                <Text style={global.paragraphWithBold}>{copy.orderNumber}</Text>
                <Text
                  style={{
                    ...track.number,
                    wordBreak: 'break-all',
                  }}>
                  {orderId}
                </Text>
              </Column>
              <Column style={{ width: '40%', verticalAlign: 'top' }}>
                <Text style={global.paragraphWithBold}>{copy.orderDate}</Text>
                <Text style={track.number}>{orderDate}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={global.hr} />

          <Section style={paddingY}>
            <Row>
              <Text
                style={{
                  ...footer.text,
                  paddingTop: 30,
                  paddingBottom: 30,
                }}>
                {copy.contact}
              </Text>
            </Row>
            <Row>
              <Text style={footer.text}>{copy.copyright}</Text>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderReceivedEmail

const paddingX = {
  paddingLeft: '40px',
  paddingRight: '40px',
}

const paddingY = {
  paddingTop: '22px',
  paddingBottom: '22px',
}

const paragraph = {
  margin: '0',
  lineHeight: '2',
}

const global = {
  paddingX,
  paddingY,
  defaultPadding: {
    ...paddingX,
    ...paddingY,
  },
  paragraphWithBold: { ...paragraph, fontWeight: 'bold' },
  heading: {
    fontSize: '32px',
    lineHeight: '1.3',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: '-1px',
  } as React.CSSProperties,
  text: {
    ...paragraph,
    color: '#747474',
    fontWeight: '500',
  },
  button: {
    border: '1px solid #929292',
    fontSize: '16px',
    textDecoration: 'none',
    padding: '10px 0px',
    width: '220px',
    display: 'block',
    textAlign: 'center',
    fontWeight: 500,
    color: '#000',
  } as React.CSSProperties,
  hr: {
    borderColor: '#E5E5E5',
    margin: '0',
  },
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '10px auto',
  width: '600px',
  maxWidth: '100%',
  border: '1px solid #E5E5E5',
}

const track = {
  container: {
    padding: '22px 40px',
    backgroundColor: '#F7F7F7',
  },
  number: {
    margin: '12px 0 0 0',
    fontWeight: 500,
    lineHeight: '1.4',
    color: '#6F6F6F',
  },
}

const message = {
  padding: '40px 74px',
  textAlign: 'center',
} as React.CSSProperties

const adressTitle = {
  ...paragraph,
  fontSize: '15px',
  fontWeight: 'bold',
}

const footer = {
  policy: {
    width: '166px',
    margin: 'auto',
  },
  text: {
    margin: '0',
    color: '#AFAFAF',
    fontSize: '13px',
    textAlign: 'center',
  } as React.CSSProperties,
}
