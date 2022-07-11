import {Box, Button, Center, PasswordInput, Text, TextInput} from "@mantine/core";
import {Form, useSubmit} from "@remix-run/react";
import {useForm} from "@mantine/form";

export function action() {
  console.log('called')
  return {}
}

export default function RegisterPage() {
  const submit = useSubmit()
  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  return (
    <Center component={'section'} style={{height: '100%'}}>
      <Box sx={theme => ({
        backgroundColor: theme.colors.blue[0],
        borderColor: theme.colors.blue[7],
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: theme.radius.sm,
        padding: theme.spacing.lg,
        marginBottom: '10%',
        width: '100%',
        [theme.fn.largerThan('xs')]: {
          width: '45%'
        },
        [theme.fn.largerThan('md')]: {
          width: '35%'
        },
        [theme.fn.largerThan('lg')]: {
          width: '30%'
        }
      })}>
        <Text component={'h1'} size={'xl'} style={{marginTop: 0}}>
          Register
        </Text>
        <Form onSubmit={form.onSubmit((values) => {
          submit(values, {method: 'post'})
        })}>
          <TextInput
            size={'md'}
            required
            label="First name"
            placeholder="Qin"
            {...form.getInputProps('firstName')}
          />

          <br/>

          <TextInput
            size={'md'}
            required
            label="Last name"
            placeholder="Guan"
            {...form.getInputProps('lastName')}
          />

          <br/>

          <TextInput
            size={'md'}
            required
            label="Email"
            placeholder="qinguan@gmail.com"
            {...form.getInputProps('email')}
          />

          <br/>

          <PasswordInput
            size={'md'}
            label="Password"
            placeholder="Password"
            {...form.getInputProps('password')}
          />

          <br/>

          <Button type={'submit'}>Register</Button>
        </Form>
      </Box>
    </Center>
  )
}
