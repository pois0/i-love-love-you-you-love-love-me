/**
Copyright (c) 2013 Mark Otto.

Copyright (c) 2017 Andrew Fong.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { useCamera, useRegisterEvents, useSigma } from "@react-sigma/core";
import { Attributes } from "graphology-types";
import { ChangeEvent, CSSProperties, useEffect, useState } from "react";
import { getNodeType } from "./logic/graphUtils";

type SearchLabelKeys = "text" | "placeholder";

/**
 * Properties for `SearchControl` component
 */
export interface SearchControlProps {
  /**
   * HTML id
   */
  id?: string;

  /**
   * HTML class
   */
  className?: string;

  /**
   * HTML CSS style
   */
  style?: CSSProperties;

  /**
   * Map of the labels we use in the component.
   * This is usefull for I18N
   */
  labels?: { [Key in SearchLabelKeys]?: string };
}

/**
 * The `SearchControl` create an input text where user can search a node in the graph by its label.
 * There is an autocomplete based on includes & lower case.
 * When a node is found, the graph will focus on the highlighted node
 *
 * ```jsx
 * <SigmaContainer>
 *   <ControlsContainer>
 *     <SearchControl />
 *   </ControlsContainer>
 * </SigmaContainer>
 * ```
 * See [[SearchControlProps]] for more information.
 *
 * @category Component
 */
export const AnimeSearchControl: React.FC<SearchControlProps> = ({
  id,
  className,
  style,
  labels = {},
}: SearchControlProps) => {
  // Get sigma
  const sigma = useSigma();
  // Get event hook
  const registerEvents = useRegisterEvents();
  // Get camera hook
  const { gotoNode } = useCamera();
  // Search value
  const [search, setSearch] = useState<string>("");
  // Datalist values
  const [values, setValues] = useState<Array<{ id: string; label: string }>>([]);
  // Selected
  const [selected, setSelected] = useState<string | null>(null);
  // random id for the input
  const [inputId, setInputId] = useState<string>("");

  /**
   * When component mount, we set a random input id.
   */
  useEffect(() => {
    setInputId(`search`);
  }, []);

  /**
   * When the search input changes, recompute the autocomplete values.
   */
  useEffect(() => {
    const newValues: Array<{ id: string; label: string }> = [];
    const searchCharacter = search.toLowerCase();
    if (!selected && search.length > 1) {
      sigma.getGraph().forEachNode((key, attr) => {
        if (getNodeType(attr) == "Anime" && attr.label && attr.label.toLowerCase().includes(searchCharacter))
          newValues.push({ id: key, label: attr.label });
      });
    }
    setValues(newValues);
  }, [search]);

  /**
   * When use clik on the stage
   *  => reset the selection
   */
  useEffect(() => {
    registerEvents({
      clickStage: () => {
        setSelected(null);
        setSearch("");
      },
    });
  }, [registerEvents]);

  /**
   * When the selected item changes, highlighted the node and center the camera on it.
   */
  useEffect(() => {
    if (!selected) {
      return;
    }

    sigma.getGraph().setNodeAttribute(selected, "highlighted", true);
    gotoNode(selected);

    return () => {
      sigma.getGraph().setNodeAttribute(selected, "highlighted", false);
    };
  }, [selected]);

  /**
   * On change event handler for the search input, to set the state.
   */
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchString = e.target.value;
    const valueItem = values.find((value) => value.label === searchString);
    if (valueItem) {
      setSearch(valueItem.label);
      setValues([]);
      setSelected(valueItem.id);
    } else {
      setSelected(null);
      setSearch(searchString);
    }
  };

  // Common html props for the div
  const htmlProps = {
    className: `react-sigma-search ${className ? className : ""}`,
    id,
    style,
  };

  return (
    <div {...htmlProps}>
      <label htmlFor={inputId} style={{ display: "none" }}>
        {labels["text"] || "Search a node"}
      </label>
      <input
        id={inputId}
        type="text"
        placeholder={labels["placeholder"] || "Search..."}
        list={`${inputId}-datalist`}
        value={search}
        onChange={onInputChange}
      />
      <datalist id={`${inputId}-datalist`}>
        {values.map((value: { id: string; label: string }) => (
          <option key={value.id} value={value.label}>
            {value.label}
          </option>
        ))}
      </datalist>
    </div>
  );
};
