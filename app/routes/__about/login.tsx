import {Box, Button, Center, PasswordInput, Text, TextInput} from "@mantine/core";
import type {ActionFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {Form, useSubmit} from "@remix-run/react";
import {useForm} from "@mantine/form";
import * as z from 'zod'

import {createUserSession, login} from "~/utils/session.server";

interface ActionData {
  errors?: z.ZodIssue[] | Record<string, string>
}

const bodySchema = z.object({
  email: z.string().min(1, 'Email must not be empty').email('Email must be valid'),
  password: z.string().min(1, 'Password must not be empty'),
})

export const action: ActionFunction = async ({request}) => {
  const formData = await request.formData()
  const result = await bodySchema.safeParseAsync({
    email: formData.get('email'),
    password: formData.get('password')
  })

  if (!result.success) {
    return json<ActionData>({
      errors: result.error.issues
    })
  }

  const user = await login({
    email: result.data.email,
    password: result.data.password
  })
  if (!user) {
    return json<ActionData>({
      errors: {
        email: 'Invalid email or password'
      }
    })
  }

  return createUserSession(user.id.toString(), '/dashboard')
}

export default function LoginPage() {
  const submit = useSubmit()
  const form = useForm({
    initialValues: {
      email: '',
      password: ''
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length > 0 ? null : 'Invalid password')
    },
  });

  return (
    <Center component={'section'} style={{height: '100%'}}>
      <Box p={'lg'} mb={'10%'} sx={theme => ({
        backgroundColor: theme.colors.violet[0],
        borderColor: theme.colors.violet[7],
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: theme.radius.sm,
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
          Login
        </Text>
        <Form onSubmit={form.onSubmit((values) => {
          submit(values, {method: 'post'})
        })}>
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
            required
            label="Password"
            placeholder="Password"
            {...form.getInputProps('password')}
          />

          <br/>

          <Button type={'submit'} color={'violet'}>Login</Button>
        </Form>
      </Box>
    </Center>
  )
}
