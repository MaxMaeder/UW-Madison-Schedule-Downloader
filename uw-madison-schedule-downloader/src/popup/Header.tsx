import { ActionIcon, Flex, Image, Header as MTHeader } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import Logo from "data-base64:~assets/Logo.svg";

const Header = () => {
  return (
    <MTHeader height={60} p="md">
      <Flex justify="space-between" align="center" sx={{ height: "100%" }}>
        <Image
          src={Logo}
          fit="contain"
          height="30px"
          imageProps={{ style: { objectPosition: "left" } }}
          alt="UW Madison Schedule Download Logo"
        />

        <ActionIcon
          component="a"
          href="https://github.com/MaxMaeder/UW-Madison-Schedule-Downloader"
          target="_blank">
          <IconBrandGithub />
        </ActionIcon>
      </Flex>
    </MTHeader>
  );
};

export default Header;
