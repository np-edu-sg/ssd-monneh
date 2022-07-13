import { Box, Button, Text, createStyles } from '@mantine/core'

const useStyles = createStyles((theme) => ({
    heading: {
        fontSize: '3rem',
        lineHeight: 1.375,
        [theme.fn.largerThan('xs')]: {
            fontSize: '4rem',
        },
    },
}))

export default function LandingPage() {
    const { classes } = useStyles()

    return (
        <Box
            component={'section'}
            sx={(theme) => ({
                [theme.fn.largerThan('sm')]: {
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                },
                [theme.fn.largerThan('md')]: {
                    paddingLeft: '8rem',
                    paddingRight: '8rem',
                },
            })}
        >
            <Text component={'h1'} className={classes.heading}>
                Cash flow management
                <br />
                for
                <Box
                    component={'span'}
                    sx={(theme) => ({ color: theme.colors.violet[8] })}
                >
                    {' '}
                    everybody
                </Box>
            </Text>

            <Button
                radius={'md'}
                variant={'gradient'}
                gradient={{ from: 'grape', to: 'violet' }}
                size={'lg'}
            >
                Get started
            </Button>
        </Box>
    )
}
