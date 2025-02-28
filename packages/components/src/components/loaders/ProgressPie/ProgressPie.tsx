import { ReactNode } from 'react';

import styled from 'styled-components';

const Container = styled.div<{
    $valueInPercents: number;
    $size: number;
    $color?: string;
    $backgroundColor?: string;
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${({ $size }) => `${$size}px`};
    height: ${({ $size }) => `${$size}px`};
    border-radius: 50%;
    background: ${({ theme, $valueInPercents, $color, $backgroundColor }) =>
        `conic-gradient(${$color || theme.legacy.BG_GREEN} ${3.6 * $valueInPercents}deg, ${
            $backgroundColor || theme.legacy.STROKE_GREY
        } 0)`};
`;

export interface ProgressPieProps {
    valueInPercents: number; // 0-100
    size?: number;
    color?: string;
    backgroundColor?: string;
    children?: ReactNode;
    className?: string;
}

export const ProgressPie = ({
    size = 16,
    children,
    valueInPercents,
    backgroundColor,
    className,
    color,
}: ProgressPieProps) => (
    <Container
        $size={size}
        $valueInPercents={valueInPercents}
        $backgroundColor={backgroundColor}
        $color={color}
        className={className}
    >
        {children}
    </Container>
);
