import {Accordion, Button, Text, TextInput, useMantineTheme} from "@mantine/core";
import {Form, useActionData, useSubmit, useTransition} from "@remix-run/react";
import {useForm} from "@mantine/form";

export default function NewOrganization() {
  const submit = useSubmit()
  const data = useActionData()
  const transition = useTransition()

  const theme = useMantineTheme()

  const form = useForm({
    initialValues: {
      name: '',
    },

    validate: {
      name: (value) => value.length > 0 ? null : 'Name is required'
    }
  })

  return (
    <div>
      <Text component={'h1'} size={'xl'} style={{marginTop: 0}}>
        Create your organization!
      </Text>

      <Form onSubmit={form.onSubmit(async (values) => {
        submit(values, {method: 'post'})
      })}>
        <Accordion
          initialItem={0}
          iconPosition={'right'}
          styles={{
            item: {
              marginBottom: theme.spacing.md,
            },
            control: {
              '&:hover': {
                backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[3]
              }
            },
            label: {
              fontWeight: 800
            },
            itemOpened: {
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[2]
            },
          }}
        >
          <Accordion.Item label={'1. Organization'}>
            <Text>
              An organization helps you group your funds logically. You can belong in multiple organizations, as well as
              invite other people to your organization.
            </Text>

            <br/>

            <TextInput
              size={'md'}
              placeholder="Organization name"
              error={data?.errors?.email}
              {...form.getInputProps('name')}
            />

            <br/>

            <Button
              color={'violet'}
              variant={'outline'}
            >
              Next
            </Button>
          </Accordion.Item>

          <Accordion.Item label={'2. Roles'}>
            <Text>
              Here you can specify permissions for the different roles in your organization.
              <br/>
              <br/>
              For example, a role could be "Finance department", which would have the ability to reimburse transactions.
            </Text>

            <br/>

            <TextInput
              size={'md'}
              placeholder="Organization name"
              error={data?.errors?.email}
              {...form.getInputProps('name')}
            />

            <br/>

            <Button
              color={'violet'}
              variant={'outline'}
            >
              Next
            </Button>
          </Accordion.Item>

          <Accordion.Item label={'3. Members'}>
            <Text>
              Lastly, start inviting people to your organization!
            </Text>

            <br/>

            <TextInput
              size={'md'}
              placeholder="Organization name"
              error={data?.errors?.email}
              {...form.getInputProps('name')}
            />

            <br/>

            <Button
              type={'submit'}
              variant={'gradient'}
              gradient={{from: 'violet', to: 'grape'}}
              loading={transition.state === 'submitting'}
            >
              Create organization!
            </Button>
          </Accordion.Item>
        </Accordion>
      </Form>
    </div>
  )
}
